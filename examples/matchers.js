/**
 * @fileOverview Shows how to define custom matchers.
 *
 * Set the file using the "--before" CLI option to have it run before test
 * suites are executed.
 *
 * For instance:
 *   angela examples/sweet.spec.js --before examples/matchers.js
 */
/* global beforeEach, addMatchers */
beforeEach(function () {
  addMatchers({
    toBeSweet: function () {
      return {
        compare: function (actual) {
          var result = { pass: false };
          result.pass = (actual === 'sweet');
          return result;
        }
      };
    }
  });
});
