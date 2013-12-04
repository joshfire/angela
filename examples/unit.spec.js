/**
 * @fileOverview Shows that Angela may also run usual unit tests.
 *
 * Note that it's a bit overkill to use Angela just for unit tests: Angela
 * starts an instance of PhantomJS in the background that is entirely useless
 * for unit tests.
 *
 * Run the example with:
 *   angela examples/unit.spec.js
 */
/* global describe, it, expect */
describe('A sync unit test', function () {
  it('passes easily', function () {
    expect(true).toBeTruthy();
  });
});
