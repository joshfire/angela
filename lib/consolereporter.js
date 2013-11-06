/**
 * @fileOverview Console reporter for Jasmine v2.0.0rc5
 */
/*global module, process*/


/**
 * Helper functions to send colorful messages to the console
 */
var colorify = function (color, msg) {
  return '\033[' + color + 'm' + msg + '\033[0m';
};
var error = function (msg) { return colorify(31, msg); };
var ok = function (msg) { return colorify(32, msg); };
var warn = function (msg) { return colorify(33, msg); };
var info = function (msg) { return colorify(34, msg); };
var log = function (msg) {
  process.stdout.write((msg || '') + '\n');
};
var logRaw = function (msg) {
  process.stdout.write(msg);
};

/**
 * Appends an "s" to the provided string if count is strictly greater than 1.
 *
 * @function
 * @param {String} str String to update
 * @param {Number} count The number of items
 * @return {String} The provided string if count equals or is lower than 1,
 *   the provided string with an "s" otherwise.
 */
var plural = function (str, count) {
  return (count === 1) ? str : str + 's';
};

var failed = [];
var pendingCount = 0;
var totalSpecs = 0;
var timer = null;

/**
 * Console reporter class
 */
var ConsoleReporter = function () {};


/**
 * Called once when Jasmine starts to run tests.
 *
 * Outputs the number of spec tests that will be run.
 */
ConsoleReporter.prototype.jasmineStarted = function (params) {
  totalSpecs = params.totalSpecsDefined;
  timer = (new Date()).getTime();
  log(info('Running ' + totalSpecs + ' spec tests...'));
  log('');
  log('Progress');
  log('--------');
};

/**
 * Called once when Jasmine is done running tests.
 *
 * Outputs the list of expectations that failed along with a summary that
 * features the number of tests that were run and the total number of
 * failures that occurred.
 */
ConsoleReporter.prototype.jasmineDone = function () {
  log('');
  if (failed.length) {
    log(plural('Failure', failed.length));
    log('--------');
    failed.forEach(function (result) {
      log(error(result.fullName + '...'));
      result.failedExpectations.forEach(function (expectation) {
        log(error('  ' + expectation.message));
      });
    });
  }

  timer = Math.round(((new Date()).getTime() - timer) / 1000);

  log('');
  log('Summary');
  log('-------');
  log(totalSpecs + plural(' spec', totalSpecs) +
    ' run in ' + timer + plural(' second', timer) + '.');

  if (failed.length) {
    log(error(failed.length + plural(' failure', failed.length)));
  }
  else {
    log(ok('no failure.'));
  }
  if (pendingCount) {
    log(warn(pendingCount + plural(' spec', pendingCount) + ' pending.'));
  }
  log('');
};


/**
 * Called each time Jasmine starts some test.
 *
 * Outputs the full name of the test along with continuation dots.
 */
ConsoleReporter.prototype.specStarted = function (result) {
  logRaw(result.fullName + '... ');
};


/**
 * Called each time Jasmine is done with some test.
 *
 * Outputs "passed", "pending" or "failed" depending on the test result.
 */
ConsoleReporter.prototype.specDone = function (result) {
  if (result.status === 'failed') {
    log(error('failed'));
    failed.push(result);
  }
  else if (result.status === 'pending') {
    pendingCount++;
    log(warn('pending'));
  }
  else {
    log(ok('passed'));
  }
};

module.exports = ConsoleReporter;
