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
/*global process, console*/

/**
 * Load dependencies
 */
var fs = require('fs');
var path = require('path');
var webdriver = require('selenium-webdriver');
var optimist = require('optimist');
var walk = require('walk');
var woodman = require('woodman');
var runTestSuites = require('./runtestsuites');


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
    '                 Spec file names must end with ".spec.js" or "Spec.js".\n' +
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
  .options('verbose', {
    alias: 'v',
    boolean: true,
    default: false,
    describe: 'Trace Angela\'s execution to the console'
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
  .options('sessionperspec', {
    boolean: true,
    default: false,
    describe: 'Angela uses the same browser session throughout by default. Set the flag to use one browser session per spec. Specs will run considerably slower.'
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
 * Lists existing test suites in the requested folder
 *
 * @function
 * @param {String} pathname Path to the folder to use
 * @param {function} callback called with the list of test suites to run
 */
var getTestSuites = function (pathname, callback) {
  var suites = [];
  var walker = null;

  // If path name is a spec file, we have our test suite
  if (pathname.match(/\.spec\.js$/i) || pathname.match(/Spec\.js$/)) {
    if (fs.existsSync(path.resolve(pathname))) {
      suites.push(path.resolve(pathname));
    }
    return callback(suites);
  }

  // List all spec files in the given path otherwise
  walker = walk.walk(pathname);
  walker.on('file', function (root, stat, next) {
    if (stat.name.match(/\.spec\.js$/i) || stat.name.match(/Spec\.js$/)) {
      suites.push(path.resolve(root, stat.name));
    }
    next();
  });
  walker.on('end', function () {
    return callback(suites);
  });
};


/**
 * Initializes trace level
 */
woodman.load({
  loggers: [
    {
      level: (argv.verbose ? 'log' : 'error'),
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
 * Display usage information if so requested
 */
if (argv.help) {
  optimist.showHelp();
  process.exit(0);
}


/**
 * Main loop: load and run the suites of tests
 */
var pathname = argv._[0] || '.';
logger.log('retrieve test suites', 'path=' + pathname);
getTestSuites(pathname, function (suites) {
  if (suites.length === 0) {
    logger.log('no spec file found', 'path=' + pathname);
    console.log('No spec file found in the path "' + pathname + '"!');
    console.log('');
    process.exit(0);
  }
  logger.info('found ' + suites.length + ' spec files in "' + pathname + '".');

  runTestSuites(suites, argv, function (err) {
    if (err) {
      logger.error('test suites could not be run');
      logger.error(err);
    }
  });
});
