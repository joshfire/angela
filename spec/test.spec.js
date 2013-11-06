/*global describe, it, expect, driver*/
describe('The home page of Joshfire.com', function () {
  it('has the right title "Joshfire"', function (done) {
    driver.get('http://joshfire.com');
    driver.getTitle().then(function (title) {
      expect(title).toEqual('Joshfire');
      done();
    });
  });
});