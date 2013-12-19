/**
 * @fileOverview This test file shows an example of an exception thrown
 * asynchronously correctly caught by Angela and reported as a test failure
 *
 * Run example with:
 *   angela examples/throw.crash.js
 */
/* global describe, it */
describe('A crash', function () {
  it('fails normally', function (done) {
    setTimeout(function () {
      throw new Error('Crash!');
    }, 0);
  });
});