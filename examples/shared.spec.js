/**
 * @fileOverview Shows how to load a given Web page only once and run a series
 * of tests against it.
 *
 * Note it is generally considered good practice to restart from scratch at the
 * beginning of each "it" block, so the following may not be a good example to
 * follow in practice. Tests do run faster if the browser does not have to
 * reload a Web page though.
 *
 * Run the example with:
 *   angela examples/shared.spec.js
 */

/* global describe, it, expect, driver, beforeEach, By */
describe('joshfire.com', function () {

  var initialized = false;
  beforeEach(function () {
    if (initialized) { return; }
    initialized = true;
    driver.get('http://joshfire.com');
  });

  it('has the right title "Joshfire"', function (done) {
    driver.getTitle()
      .then(function (title) {
        expect(title).toEqual('Joshfire');
      })
      .then(done);
  });

  it('has "#1" in the title banner', function (done) {
    driver.findElement(By.css('h1'))
      .then(function (el) { return el.getText(); })
      .then(function (text) { expect(text).toContain('#1'); })
      .then(done);
  });
});