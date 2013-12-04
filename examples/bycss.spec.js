/**
 * @fileOverview Shows a basic example of By.css selector usage
 *
 * Run the example with:
 *   angela spec/bycss.spec.js
 */
/* global describe, it, expect, driver, By */
describe('The home page of Joshfire.com', function () {
  it('has the "#1" in the title banner', function (done) {
    driver.get('http://joshfire.com')
      .then(function () { return driver.findElement(By.css('h1')); })
      .then(function (el) { return el.getText(); })
      .then(function (text) { expect(text).toContain('#1'); })
      .then(done);
  });
});