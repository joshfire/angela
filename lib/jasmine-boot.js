/**
 * @fileOverview Initializes Jasmine.
 *
 * The file is an adaptation of Jasmine 2.0.0rc5 boot.js file. The adjustments
 * were made for the code to run in a Node.js environment.
 */
/*global exports*/

var jasmineRequire = require('./jasmine');
var jasmine = jasmineRequire.core(jasmineRequire);
var ConsoleJasmineReporter = require('./consolereporter');
var env = jasmine.getEnv();
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;


/**
 * Helper function for readability above.
 */
var extend = function (destination, source) {
  for (var property in source) destination[property] = source[property];
  return destination;
};


/**
 * ## The Global Interface
 *
 * Build up the functions that will be exposed as the Jasmine public interface. A project can customize, rename or alias any of these functions as desired, provided the implementation remains unchanged.
 */
var jasmineInterface = {
  describe: function(description, specDefinitions) {
    return env.describe(description, specDefinitions);
  },

  xdescribe: function(description, specDefinitions) {
    return env.xdescribe(description, specDefinitions);
  },

  it: function(desc, func) {
    return env.it(desc, func);
  },

  xit: function(desc, func) {
    return env.xit(desc, func);
  },

  beforeEach: function(beforeEachFunction) {
    return env.beforeEach(beforeEachFunction);
  },

  afterEach: function(afterEachFunction) {
    return env.afterEach(afterEachFunction);
  },

  expect: function(actual) {
    return env.expect(actual);
  },

  pending: function() {
    return env.pending();
  },

  spyOn: function(obj, methodName) {
    return env.spyOn(obj, methodName);
  },

  jsApiReporter: new jasmine.JsApiReporter({
    timer: new jasmine.Timer()
  })
};

exports.jasmine = jasmine;
extend(exports, jasmineInterface);

/**
 * Expose the interface for adding custom equality testers.
 */
jasmine.addCustomEqualityTester = function(tester) {
  env.addCustomEqualityTester(tester);
};

/**
 * Expose the interface for adding custom expectation matchers
 */
jasmine.addMatchers = function(matchers) {
  return env.addMatchers(matchers);
};

/**
 * Expose the mock interface for the JavaScript timeout functions
 */
jasmine.clock = function() {
  return env.clock;
};

env.catchExceptions(true);
env.addReporter(jasmineInterface.jsApiReporter);
env.addReporter(new ConsoleJasmineReporter());
