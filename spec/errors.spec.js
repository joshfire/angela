/*global describe, it, expect, driver*/
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