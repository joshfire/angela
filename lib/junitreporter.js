/**
 * @fileOverview JUnit XML reporter for Jasmine v2.0.0rc5
 *
 * The JUnit XML reporter was adapted from Larry Myers JUnit reporter for
 * Jasmine v1.3, Copyright (c) 2010 Larry Myers, MIT licensed:
 * https://github.com/larrymyers/jasmine-reporters
 *
 * The reporter does not properly support nested test suites.
 */
/*global module*/

function elapsed(startTime, endTime) {
  return (endTime - startTime)/1000;
}

function ISODateString(d) {
  function pad(n) { return n < 10 ? '0'+n : n; }

  return d.getFullYear() + '-' +
      pad(d.getMonth()+1) + '-' +
      pad(d.getDate()) + 'T' +
      pad(d.getHours()) + ':' +
      pad(d.getMinutes()) + ':' +
      pad(d.getSeconds());
}

function trim(str) {
  return str.replace(/^\s+/, '' ).replace(/\s+$/, '' );
}

function escapeInvalidXmlChars(str) {
  return str.replace(/\&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/\>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&apos;');
}


/**
 * Generates JUnit XML for the given spec run.
 * Allows the test results to be used in java based CI
 * systems like CruiseControl and Hudson.
 *
 * @param {string} savePath where to save the files
 * @param {boolean} consolidate whether to save nested describes within the
 *                  same file as their parent; default: true
 * @param {boolean} useDotNotation whether to separate suite names with
 *                  dots rather than spaces (ie "Class.init" not
 *                  "Class init"); default: true
 */
var JUnitXmlReporter = function(savePath, consolidate, useDotNotation) {
  this.savePath = savePath || '';
  this.consolidate = (typeof consolidate === 'undefined') ? true : consolidate;
  this.useDotNotation = (typeof useDotNotation === 'undefined') ? true : useDotNotation;
  this.runningSuites = [];
  this.suites = [];
};


JUnitXmlReporter.prototype.suiteStarted = function (suite) {
  this.suites.push(suite);
  this.runningSuites.push(suite);
  suite.startTime = new Date();
};


JUnitXmlReporter.prototype.suiteDone = function (suite) {
  suite.startTime = suite.startTime || new Date();
  suite.duration = elapsed(suite.startTime, new Date());
  this.runningSuites.pop(suite);
};


JUnitXmlReporter.prototype.specStarted = function (spec) {
  spec.startTime = new Date();
  var suite = this.runningSuites[this.runningSuites.length - 1];
  if (!suite.specs) {
    suite.specs = [];
  }
  suite.specs.push(spec);
  spec.suite = suite;
};


JUnitXmlReporter.prototype.specDone = function (spec) {
  spec.duration = elapsed(spec.startTime, new Date());
  spec.duration = elapsed(spec.startTime, new Date());
  spec.output = '<testcase ' +
    'classname="' + this.getFullName(spec.suite) + '" ' +
    'name="' + escapeInvalidXmlChars(spec.description) + '" ' +
    'time="' + spec.duration + '">';

  var failure = '';
  var failures = 0;
  spec.failedExpectations.forEach(function (expectation) {
    failures += 1;
    failure += (failures + ': ' + escapeInvalidXmlChars(expectation.message) + ' ');
  });
  if (failure) {
    spec.output += '\n      <failure>' + trim(failure) + '</failure>\n    ';
  }
  spec.output += '</testcase>';
};


JUnitXmlReporter.prototype.jasmineDone = function () {
  var self = this;
  this.suites.forEach(function (suite) {
    var fileName = 'report-' + self.getFullName(suite, true) + '.xml';
    var output = '<?xml version="1.0" encoding="UTF-8" ?>\n' +
      '<testsuites>\n';
    var failedCount = 0;

    suite.specs = suite.specs || [];
    suite.specs.forEach(function (spec) {
      if (spec.status === 'failed') {
        failedCount += 1;
      }
    });

    output += '  <testsuite name="' + self.getFullName(suite) + '" ' +
      'errors="0" ' +
      'tests="' + suite.specs.length + '" ' +
      'failures="' + failedCount + '" ' +
      'time="' + suite.duration + '" ' +
      'timestamp="' + ISODateString(suite.startTime) + '">\n';
    suite.specs.forEach(function (spec) {
      output += '    ' + spec.output + '\n';
    });
    output += '  </testsuite>\n' +
      '</testsuites>';
    self.writeFile(self.savePath + fileName, output);
  });
};


JUnitXmlReporter.prototype.writeFile = function (filename, text) {
  // Rhino
  try {
    var out = new java.io.BufferedWriter(new java.io.FileWriter(filename));
    out.write(text);
    out.close();
    return;
  } catch (e) {}
  // PhantomJS, via a method injected by phantomjs-testrunner.js
  try {
    __phantom_writeFile(filename, text);
    return;
  } catch (f) {}
  // Node.js
  try {
    var fs = require('fs');
    var fd = fs.openSync(filename, 'w');
    fs.writeSync(fd, text, 0);
    fs.closeSync(fd);
    return;
  } catch (g) {}
};


JUnitXmlReporter.prototype.getFullName = function (suite, isFilename) {
  var fullName = suite.fullName;

  // Either remove or escape invalid XML characters
  if (isFilename) {
    return fullName.replace(/[^\w]/g, '');
  }
  return escapeInvalidXmlChars(fullName);
};


// export public
module.exports = JUnitXmlReporter;
