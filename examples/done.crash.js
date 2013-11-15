/**
 * @fileOverview This test file will crash Jasmine and thus Angela because
 * it contains an asynchronous test that does not take any "done" parameter.
 *
 * A similar crash would occur if the "it" function callback called the "done"
 * function before all "except" clauses have run.
 *
 * The exception cannot be properly trapped in the test runner because of the
 * use of "setTimeout" that resets the call stack.
 *
 * Run example with:
 *   angela spec/async.crash.js
 */
/* global describe, it, expect */
describe('A crash', function () {
  it('is a crash', function () {
    setTimeout(function () {
      expect(true).toBeFalsy();
    }, 0);
  });
});