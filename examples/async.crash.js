/**
 * @fileOverview This test file will crash Jasmine and thus Angela because
 * it contains an asynchronous test that throws an exception outside of the
 * context of the WebDriver control flow.
 *
 * The exception cannot be properly trapped in the test runner because of the
 * use of "setTimeout" that resets the call stack.
 *
 * Run example with:
 *   angela examples/async.crash.js
 */
/* global describe, it */
describe('A crash', function () {
  it('is a crash', function (done) {
    setTimeout(function () {
      throw new Error('Crash!');
    }, 0);
  });
});