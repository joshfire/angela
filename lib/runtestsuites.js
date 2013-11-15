/**
 * @fileOverview Exposes a function to run Jasmine test suites against some
 * Web browser and reports the results, either to the console or to JUnit
 * XML files.
 *
 * By default, tests are run against a running instance of PhantomJS
 * (a headless Webkit browser). This may be changed through command-line
 * parameters though.
 *
 * Unless told otherwise, the runner launches the appropriate Webdriver server
 * to launch requested tests. Parameters are those of the underlying CLI tool,
 * see "runner.js" for details.
 *
 * Note that the function leaks Jasmine functions to the global scope, along
 * with a "pilot" namespace to ease spec tests authoring.
 */
/*global global, process, __dirname, module*/

/**
 * Load dependencies
 */
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var phantomjsPath = require('phantomjs').path;
var webdriver = require('selenium-webdriver');
var woodman = require('woodman');

var jasmineModule = require('./jasmine-boot');
var JUnitReporter = require('./junitreporter');

var logger = woodman.getLogger('runnerlib');

/**
 * Runs the test suites and calls the callback when execution is over.
 *
 * @function
 * @param {Array(String)} suites The list of test suites to run
 * @param {Object} options Execution options, see underlying CLI options for
 *  details.
 * @param {function} callback Called when execution is over or when an error
 *  occurred!
 */
module.exports = function runTestSuites(suites, options, callback) {
  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 8195;
  options.browser = options.browser || 'phantomjs';

  /**
   * The Webdriver server process instance
   */
  var webdriverServer = null;

  /**
   * Load Jasmine and expose Jasmine methods globally so that test suites
   * may reference these methods right away.
   */
  var jasmineEnv = jasmineModule.jasmine.getEnv();
  global.jasmine = jasmineModule.jasmine;
  global.expect = jasmineEnv.expect;
  global.spyOn = jasmineEnv.spyOn;
  global.beforeEach = jasmineEnv.beforeEach;
  global.afterEach = jasmineEnv.afterEach;
  global.addMatchers = jasmineEnv.addMatchers;
  global.addReporter = jasmineEnv.addReporter;
  global.pending = jasmineEnv.pending;
  global.xdescribe = jasmineEnv.xdescribe;
  global.xit = jasmineEnv.xit;
  global.By = webdriver.By;

  // The global WebDriverJS instance
  global.driver = null;
  global.describeNestedDepth = 0;

  // WebDriver on Android devices runs slow, set timeout to 2 minutes
  if (options.browser === 'android') {
    global.jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
  }

  /**
   * Wrap and expose Jasmine's "describe" function to create one Webdriver
   * session per spec if so requested and reset spec exception handler on
   * Webdriver's control flow after each spec.
   */
  global.describe = function (specDesc, specFunction) {
    global.describeNestedDepth += 1;

    if (global.describeNestedDepth === 1) {
      return jasmineEnv.describe(specDesc, function () {
        if (options.sessionperspec) {
          jasmineModule.beforeEach(function (done) {
            global.driver = createWebDriver();
            done();
          });

          jasmineEnv.afterEach(function (done) {
            global.driver.controlFlow().removeAllListeners('uncaughtException');
            global.driver.quit().then(function () {
              global.driver = null;
              done();
            });
          });
        }
        else {
          jasmineEnv.afterEach(function () {
            global.driver.controlFlow().removeAllListeners('uncaughtException');
          });
        }

        specFunction.call(this);
        global.describeNestedDepth -= 1;
      });
    }
    else {
      return jasmineEnv.describe(specDesc, function () {
        specFunction.call(this);
        global.describeNestedDepth -= 1;
      });
    }
  };

  /**
   * Wrap and expose Jasmine's "it" function to add the exception handler for
   * uncaught failed Webdriver promises.
   */
  global.it = function (description, fn) {
    if (!fn) {
      return jasmineEnv.it(description);
    }
    return jasmineEnv.it(description, (function (done) {
      global.driver.controlFlow().on('uncaughtException', function (err) {
        jasmineEnv.expect(err).toBeNull();
        done();
      });
      if (fn.length) {
        fn(done);
      }
      else {
        fn();
        done();
      }
    }).bind(this));
  };


  /**
   * Returns a new instance of a Webdriver
   */
  var createWebDriver = function () {
    return new webdriver.Builder()
      .usingServer(
        'http://' + options.host + ':' + options.port +
        ((options.browser !== 'phantomjs') && (options.browser !== 'chrome') ?
          '/wd/hub' : '')
      )
      .withCapabilities(webdriver.Capabilities[options.browser]())
      .build();
  };


  /**
   * Kill everything when execution is over, unless user wants to keep things
   * around for some reason.
   *
   * Note the 1s delay after sending the "kill" signal to the Webdriver server,
   * as a "cheap" though dirty way to be reasonably sure that the process has
   * been killed before the callback is called. It would be better to really
   * ensure that the process has truly been killed.
   */
  var killThemAll = function (cb) {
    if (options.keep) {
      logger.info('"keep" option set, hit CTRL+C to quit');
      return cb();
    }
    if (!global.driver) {
      if (!webdriverServer) return cb();
      logger.log('kill Webdriver server...');
      webdriverServer.kill();
      logger.log('kill Webdriver server... signal sent');
      setTimeout(cb, 1000);
      return;
    }

    logger.log('close and quit Webdriver session...');
    global.driver.quit()
      .then(function () {
        logger.log('close and quit Webdriver session... done');
        if (!webdriverServer) return cb();
        logger.log('kill Webdriver server...');
        webdriverServer.kill();
        logger.log('kill Webdriver server... signal sent');
        setTimeout(cb, 1000);
        return;
      }, function (err) {
        logger.log('close and quit Webdriver session... failed, ' + err);
        if (!webdriverServer) return cb();
        logger.log('kill Webdriver server...');
        webdriverServer.kill();
        logger.log('kill Webdriver server... signal sent');
        setTimeout(cb, 1000);
        return;
      });
  };


  /**
   * Kill everything if some uncaught exception sneaks its way to
   * the process level
   */
  var handleGlobalException = function (err) {
    if (err.toString().indexOf('Cannot call method \'expect\' of null') >= 0) {
      logger.error('Uncaught exception detected!\n\n' +
        'This exception is most likely due to an asynchronous "it" clause that does take a "done" parameter.\n' +
        'Check the name of the spec file in the stack trace below and look for code such as:\n' +
        '  it("is an async test", function () { ... });\n' +
        'That code should be replaced with:\n' +
        '  it("is an async test", function (done) { ... });\n' +
        '... and the "done" function must be called when all expect clauses have run.\n\n' +
        err);
    }
    else {
      logger.error('Uncaught exception detected!\n\n' +
        'If that seems to be a bug in the code of Angela, please report the issue to:\n\n' +
        '  https://github.com/joshfire/angela/issues\n\n' +
        err);
    }
    killThemAll(function () {
      // Throw the exception to kill the calling process
      // and report the stack trace to the user.
      throw err;
    });
  };


  /**
   * Jasmine does not report when execution is over to the external world. The
   * easiest way to detect this is thus to add a custom reporter that reacts
   * to its "jasmineDone" event.
   *
   * The goal is to kill the "webdriverServer" instance when tests are over
   */
  var DoneReporter = function (cb) {
    this.jasmineDone = cb;
  };
  if (!options.keep) {
    jasmineEnv.addReporter(new DoneReporter(function () {
      logger.info('all test suites were run');
      if (options.after) {
        logger.log('run "after" custom code...');
        require(options.after);
      }
      killThemAll(callback);
    }));
  }


  /**
   * Starts the Webdriver endpoint that Jasmine will interact with.
   *
   * The function launches a child process in the background and listens
   * to its stdout/stderr to detect when the process is started and to log
   * what happens in a log file if needed.
   *
   * @function
   * @param {function} cb Called when the server is started
   */
  var startWebDriverServer = function (cb) {
    logger.log('start Webdriver server...');
    if (options.useserver || (options.host !== 'localhost')) {
      logger.info('Runner will use running instance of Webdriver server');
      return cb();
    }

    var logStream = null;
    var params = [];
    var started = false;

    var timeout = setTimeout(function () {
      logger.error('start Webdriver server... timed out');
      cb(new Error(
        'A timeout occurred while trying to start Webdriver server!'));
    }, 30000);

    if (options.browser === 'phantomjs') {
      params = ['--webdriver=' + options.port];
      if (options.serverlog) {
        params.push('--webdriver-logfile=' + options.serverlog);
      }
      webdriverServer = childProcess.spawn(phantomjsPath, params);

      // Wait for the start process to complete.
      webdriverServer.stdout.setEncoding('utf-8');
      webdriverServer.stdout.on('data', function (data) {
        if (!started &&
            (data.indexOf('running on port ' + options.port) !== -1)) {
          started = true;
          webdriverServer.stdout.removeAllListeners('data');
          logger.info('PhantomJS driver server started');
          clearTimeout(timeout);
          timeout = null;
          cb();
        }
      });
    }
    else if (options.browser === 'chrome') {
      params = ['--port=' + options.port];
      if (options.serverlog) {
        params.push('--log-path=' + options.serverlog);
      }
      webdriverServer = childProcess.spawn(
        path.resolve(__dirname, '..', 'drivers', 'chromedriver 3'),
        params
      );
      webdriverServer.stdout.setEncoding('utf-8');
      webdriverServer.stdout.on('data', function (data) {
        if (!started && data.indexOf(' on port ' + options.port) !== -1) {
          started = true;
          webdriverServer.stdout.removeAllListeners('data');
          logger.info('Chrome driver server started');
          clearTimeout(timeout);
          timeout = null;
          cb();
        }
      });
    }
    else if (options.browser === 'android') {
      params = [
        path.resolve(__dirname, '..', 'drivers', 'androiddriver.sh'),
        options.port
      ];
      logger.log(params);
      webdriverServer = childProcess.spawn('sh', params);
      if (options.serverlog) {
        logStream = fs.createWriteStream(options.serverlog, {
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
          if (!options.serverlog) {
            webdriverServer.stdout.removeAllListeners('data');
          }
          logger.info('Android driver server started');
          clearTimeout(timeout);
          timeout = null;
          cb();
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
        '-port', options.port
      ];
      if (options.serverlog) {
        logStream = fs.createWriteStream(options.serverlog, {
          encoding: 'utf-8'
        });
      }
      webdriverServer = childProcess.spawn('java', params);
      webdriverServer.stdout.setEncoding('utf-8');
      webdriverServer.stdout.on('data', function (data) {
        if (logStream) logStream.write(data, 'utf-8');
        if (!started && (data.indexOf('Started SocketListener on ') !== -1)) {
          started = true;
          if (!options.serverlog) {
            webdriverServer.stdout.removeAllListeners('data');
          }
          logger.info('Selenium standalone server started');
          clearTimeout(timeout);
          timeout = null;
          cb();
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
   * Catch any uncaught exception, wrap things up and exit
   */
  process.once('uncaughtException', function (err) {
    handleGlobalException(err);
  });

  /**
   * Run custom code if user set the "custom" option
   */
  if (options.before) {
    require(options.before);
  }


  /**
   * Main loop:
   * - start remote WebDriver server if possible
   * - create the Web driver, unless one instance is to be used per spec
   * - run the suites of tests
   */
  startWebDriverServer(function (err) {
    if (err) return callback(err);

    if (!options.sessionperspec) {
      logger.log('create client Webdriver');
      global.driver = createWebDriver();
    }
    logger.log('load test suites...');
    suites.forEach(require);
    logger.log('load test suites... done');

    if (options.junit) {
      logger.log('prepare JUnit reporter...');
      try {
        fs.mkdirSync('junitreports');
      }
      catch (err) {
        if (err.code !== 'EEXIST') {
          return callback(new Error(
            'Could not create "junitreports" folder, check permissions'));
        }
      }
      jasmineEnv.addReporter(new JUnitReporter('junitreports/'));
      logger.log('prepare JUnit reporter... done');
    }

    logger.log('running test suites');
    jasmineEnv.execute();
  });
};
