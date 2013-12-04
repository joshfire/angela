/**
 * @fileOverview Shows how exceptions that get thrown within Jasmine or within
 * a WebDriver command are caught and converted to test failures.
 *
 * Run example with:
 *   angela examples/errors.spec.js
 */
/* global describe, it, driver */
describe('An exception', function () {
  it('is caught', function (done) {
    throw new Error('oh no!');
  });

  it('is caught by Webdriver when async', function (done) {
    driver.get('http://joshfire.com')
      .then(function () {
        throw new Error('oh no, async version!');
      })
      .then(done);
  });
});