/**
 * @fileOverview Shows how to set the viewport dimensions of the browser window
 *
 * WebDriver does not let one set the viewport dimensions directly, only the
 * dimensions of the outer window, including navigation bar and other status
 * bars.
 *
 * The "trick" is thus to compute the diff between the outer window and the
 * inner window dimensions and to apply that diff to the requested viewport
 * dimensions.
 */

/* global describe, it, expect, driver, By */

describe('The viewport', function () {
  it('has the right dimensions', function (done) {
    var viewport = {
      width: 320,
      height: 480
    };
    var outer = {};
    driver.manage().window().getSize()
      .then(function (size) {
        outer.width = size.width;
        outer.height = size.height;
      })
      .then(function () {
        return driver.executeScript('return { ' +
          'width: window.innerWidth, ' +
          'height: window.innerHeight' +
          '};');
      })
      .then(function (size) {
        return driver.manage().window().setSize(
          viewport.width + outer.width - size.width,
          viewport.height + outer.height - size.height);
      })
      .then(function () {
        return driver.findElement(By.css('body'));
      })
      .then(function (el) {
        return el.getSize();
      })
      .then(function (size) {
        expect(size.width).toEqual(320);
        expect(size.height).toEqual(480);
      })
      .then(done);
  });
});