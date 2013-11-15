/**
 * @fileOverview Shows a basic example of WebDriverJS usage
 *
 * Run the example with:
 *   angela spec/test.spec.js
 *
 * If you want to see the execution of the test in a real browser, you may run
 * the example in e.g. Chrome with:
 *   angela spec/test.spec.js --browser chrome
 */
/* global describe, it, expect, driver */
describe('The home page of Joshfire.com', function () {
  it('has the right title "Joshfire"', function (done) {
    driver.get('http://joshfire.com');
    driver.getTitle().then(function (title) {
      expect(title).toEqual('Joshfire');
      done();
    });
  });
});