/**
 * @fileOverview Shows how to use custom matchers.
 *
 * The test will pass if the custom matcher "toBeSweet", defined in
 * "matchers.js" has been loaded bfore the test is run. It will fail
 * with an invalid function call otherwise.
 *
 * Run the example with:
 *   angela spec/sweet.spec.js --before spec/matchers.js
 */
/* global describe, it, expect */
describe('A sweet test', function () {
  it('passes when matcher is available', function () {
    expect('sweet').toBeSweet();
  });
});
