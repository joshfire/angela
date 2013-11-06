#!/usr/bin/env node
/**
 * @fileOverview Generic test runner that runs WebDriver Jasmine tests against
 * some Web browser and reports the results.
 *
 * By default, tests are run against a running instance of PhantomJS
 * (a headless Webkit browser). This may be changed through command-line
 * parameters though.
 *
 * Unless told otherwise, the runner launches the appropriate Webdriver server
 * to launch requested tests (set the "--useserver" flag to force the runner to
 * use a running Webdriver server), and closes the created browser instance once
 * tests are over (set the "--keep" flag to keep everything open).
 */
/*global global, process, __dirname, console*/

/**
 * Load dependencies
 */
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var phantomjsPath = require('phantomjs').path;
var webdriver = require('selenium-webdriver');
var optimist = require('optimist');
var walk = require('walk');
var woodman = require('woodman');

var jasmineModule = require('./jasmine-boot');
var JUnitReporter = require('./junitreporter');

woodman.load({
  loggers: [
    {
      level: 'info',
      appenders: [
        {
          type: 'Console',
          name: 'console',
          layout: {
            type: 'pattern',
            pattern: '%d{HH:mm:ss} [%level] %message%n'
          }
        }
      ]
    }
  ]
});
var logger = woodman.getLogger('runner');


/**
 * Set CLI parameters and options
 */
var argv = optimist
  .usage('Angela - Copyright (c) 2013 Joshfire. All rights reserved.\n\n' +
    'CLI tool to run Jasmine test suites against a Web application that runs in a\n' +
    'Web browser controlled with WebDriver.\n\n' +
    'Usage: $0 [path]\n\n' +
    'Parameters:\n' +
    '  path           Spec file or folder that contains the spec files.\n' +
    '                 Spec file names must end with ".spec.js".\n' +
    '                 The tool will recurse through subfolders to list spec files.\n' +
    '                 If no path is given, the tool will search for spec files in\n' +
    '                 current working directory.')
  .options('browser', {
    alias: 'b',
    default: 'phantomjs',
    describe: 'Webdriver browser endpoint. The code automatically starts the "right" Webdriver server based on that setting. Possible values include "phantomjs", "chrome", "firefox", "safari", or "android" (provided browser or device is available on your machine).'
  })
  .options('host', {
    default: 'localhost',
    describe: 'Webdriver server host'
  })
  .options('port', {
    default: 8195,
    describe: 'Webdriver server port'
  })
  .options('serverlog', {
    default: '',
    describe: 'Log Webdriver server execution to provided log file'
  })
  .options('useserver', {
    boolean: true,
    default: false,
    describe: 'Whether to use running Webdriver server or to start one'
  })
  .options('keep', {
    alias: 'k',
    boolean: true,
    default: false,
    describe: 'Whether to keep the browser open when tests are over'
  })
  .options('junit', {
    boolean: true,
    default: false,
    describe: 'Create JUnit XML reports (in "junitreports" folder)'
  })
  .options('help', {
    alias: 'h',
    boolean: true,
    describe: 'Displays usage help'
  })
  .check(function (argv) {
    // Ensure the requested browser is a well-known browser
    return webdriver.Capabilities[argv.browser];
  })
  .wrap(80)
  .argv;



/**
 * Load Jasmine and expose Jasmine methods globally so that test suites
 * may reference these methods right away.
 */
global.describe = jasmineModule.describe;
global.it = jasmineModule.it;
global.expect = jasmineModule.expect;
global.spyOn = jasmineModule.spyOn;
global.beforeEach = jasmineModule.beforeEach;
global.jasmine = jasmineModule.jasmine;
global.pending = jasmineModule.pending;
global.driver = null;

// WebDriver on Android devices runs slow, set timeout to 2 minutes
if (argv.browser === 'android') {
  global.jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
}


/**
 * The Webdriver server process instance
 */
var webdriverServer = null;


/**
 * Kill everything when execution is over, unless use wants to keep things
 * around.
 */
var killThemAll = function () {
  if (argv.keep) {
    logger.info('"keep" option set, hit CTRL+C to quit');
    return;
  }
  if (!global.driver) {
    if (webdriverServer) {
      logger.log('kill Webdriver server...');
      webdriverServer.kill();
      logger.log('kill Webdriver server... signal sent');
    }
    return;
  }

  logger.log('close and quit Webdriver session...');
  global.driver.quit()
    .then(function () {
      logger.log('close and quit Webdriver session... done');
      if (webdriverServer) {
        logger.log('kill Webdriver server...');
        webdriverServer.kill();
        logger.log('kill Webdriver server... signal sent');
      }
    }, function (err) {
      logger.log('close and quit Webdriver session... failed, ' + err);
      if (webdriverServer) {
        logger.log('kill Webdriver server...');
        webdriverServer.kill();
        logger.log('kill Webdriver server... signal sent');
      }
    });
};


/**
 * Kill everything if some uncaught exception occurred
 */
process.on('uncaughtException', function (err) {
  logger.error(err);
  killThemAll();
});


/**
 * Jasmine does not report when execution is over to the external world. The
 * easiest way to detect this is thus to add a custom reporter that reacts
 * to its "jasmineDone" event.
 *
 * The goal is to kill the "webdriverServer" server when tests are over
 */
var DoneReporter = function (callback) {
  this.jasmineDone = callback;
};
if (!argv.keep) {
  global.jasmine.getEnv().addReporter(new DoneReporter(killThemAll));
}


/**
 * Lists existing test suites in the test folder
 */
var getTestSuites = function (pathname, callback) {
  var suites = [];
  var walker = null;

  // If path name is a spec file, we have our test suite
  if (pathname.match(/\.spec\.js$/i)) {
    if (fs.existsSync(path.resolve(pathname))) {
      suites.push(path.resolve(pathname));
    }
    return callback(suites);
  }

  // List all spec files in the given path otherwise
  walker = walk.walk(pathname);
  walker.on('file', function (root, stat, next) {
    if (stat.name.match(/\.spec\.js$/i)) {
      suites.push(path.resolve(root, stat.name));
    }
    next();
  });
  walker.on('end', function () {
    return callback(suites);
  });
};


/**
 * Starts the Webdriver endpoint that Jasmine will interact with.
 *
 * @function
 * @param {function} callback Called when the server is started
 */
var startWebDriverServer = function (callback) {
  logger.log('start Webdriver server...');
  if (argv.useserver || (argv.host !== 'localhost')) {
    logger.info('Runner will use running instance of Webdriver server');
    return callback();
  }

  var timeout = setTimeout(function () {
    logger.error('start Webdriver server... timed out');
    process.exit(1);
  }, 30000);

  var logStream = null;
  var params = [];
  var started = false;

  if (argv.browser === 'phantomjs') {
    params = ['--webdriver=' + argv.port];
    if (argv.serverlog) {
      params.push('--webdriver-logfile=' + argv.serverlog);
    }
    webdriverServer = childProcess.spawn(phantomjsPath, params);

    // Waiting for the start process to complete.
    webdriverServer.stdout.setEncoding('utf-8');
    webdriverServer.stdout.on('data', function (data) {
      if (!started && data.indexOf('running on port ' + argv.port) !== -1) {
        started = true;
        webdriverServer.stdout.removeAllListeners('data');
        logger.info('PhantomJS driver server started');
        clearTimeout(timeout);
        timeout = null;
        callback();
      }
    });
  }
  else if (argv.browser === 'chrome') {
    params = ['--port=' + argv.port];
    if (argv.serverlog) {
      params.push('--log-path=' + argv.serverlog);
    }
    webdriverServer = childProcess.spawn(
      path.resolve(__dirname, '..', 'drivers', 'chromedriver 3'),
      params
    );
    webdriverServer.stdout.setEncoding('utf-8');
    webdriverServer.stdout.on('data', function (data) {
      if (!started && data.indexOf(' on port ' + argv.port) !== -1) {
        started = true;
        webdriverServer.stdout.removeAllListeners('data');
        logger.info('Chrome driver server started');
        clearTimeout(timeout);
        timeout = null;
        callback();
      }
    });
  }
  else if (argv.browser === 'android') {
    params = [
      path.resolve(__dirname, '..', 'drivers', 'androiddriver.sh'),
      argv.port
    ];
    logger.log(params);
    webdriverServer = childProcess.spawn('sh', params);
    if (argv.serverlog) {
      logStream = fs.createWriteStream(argv.serverlog, {
        encoding: 'utf-8'
      });
    }
    webdriverServer.stdout.setEncoding('utf-8');
    webdriverServer.stdout.on('data', function (data) {
      if (logStream) logStream.write(data, 'utf-8');
      if (!started &&
          (data.indexOf('START ') !== -1) &&
          (data.indexOf('org.openqa.selenium.android.app/.MainActivity') !== -1)) {
        started = true;
        if (!argv.serverlog) {
          webdriverServer.stdout.removeAllListeners('data');
        }
        logger.info('Android driver server started');
        clearTimeout(timeout);
        timeout = null;
        callback();
      }
    });
    webdriverServer.stderr.setEncoding('utf-8');
    webdriverServer.stderr.on('data', function (data) {
      if (logStream) logStream.write(data, 'utf-8');
      logger.log('[Android driver]', data);
    });
    webdriverServer.stdout.on('end', function () {
      if (logStream) {
        logStream.end();
        logStream.close();
        logStream = null;
      }
    });
  }
  else {
    params = [
      '-jar', path.resolve(__dirname, '..', 'drivers',
        'selenium-server-standalone-2.37.0.jar'),
      '-port', argv.port
    ];
    if (argv.serverlog) {
      logStream = fs.createWriteStream(argv.serverlog, {
        encoding: 'utf-8'
      });
    }
    webdriverServer = childProcess.spawn('java', params);
    webdriverServer.stdout.setEncoding('utf-8');
    webdriverServer.stdout.on('data', function (data) {
      if (logStream) logStream.write(data, 'utf-8');
      if (!started && (data.indexOf('Started SocketListener on ') !== -1)) {
        started = true;
        if (!argv.serverlog) {
          webdriverServer.stdout.removeAllListeners('data');
        }
        logger.info('Selenium standalone server started');
        clearTimeout(timeout);
        timeout = null;
        callback();
      }
    });
    webdriverServer.stderr.setEncoding('utf-8');
    webdriverServer.stderr.on('data', function (data) {
      if (logStream) logStream.write(data, 'utf-8');
      logger.log('[Selenium]', data);
    });
    webdriverServer.stdout.on('end', function () {
      if (logStream) {
        logStream.end();
        logStream.close();
        logStream = null;
      }
    });
  }
};


/**
 * Display usage information if so requested
 */
if (argv.help) {
  optimist.showHelp();
  process.exit(0);
}


/**
 * Main loop:
 * - load the suites of tests to run
 * - start remote WebDriver server (if possible)
 * - create the Web driver instance
 * - run the suites of tests
 */
var pathname = argv._[0] || '.';
getTestSuites(pathname, function (suites) {
  if (suites.length === 0) {
    console.log('No spec file found in the path "' + pathname + '"!');
    console.log('');
    process.exit(0);
  }
  logger.log('Found ' + suites.length + ' spec files in "' + pathname + '".');

  startWebDriverServer(function () {
    global.driver = new webdriver.Builder()
      .usingServer('http://' + argv.host + ':' + argv.port +
        ((argv.browser !== 'phantomjs') && (argv.browser !== 'chrome') ?
          '/wd/hub' : '')
      )
      .withCapabilities(webdriver.Capabilities[argv.browser]())
      .build();
    suites.forEach(require);

    if (argv.junit) {
      try {
        fs.mkdirSync('junitreports');
      }
      catch (err) {
      }
      global.jasmine.getEnv().addReporter(new JUnitReporter('junitreports/'));
    }
    global.jasmine.getEnv().execute();
  });
});
