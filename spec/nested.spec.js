/*global describe, it, expect, driver*/
describe('Home page', function () {
  it('has the right title "Joshfire"', function (done) {
    driver.get('http://joshfire.com');
    driver.getTitle().then(function (title) {
      expect(title).toEqual('Joshfire');
      done();
    });
  });

  describe('Header', function () {
    it('has the right title', function (done) {
      driver.get('http://joshfire.com/fr/');
      driver.getTitle().then(function (title) {
        expect(title).toEqual('Joshfire');
        done();
      });
    });
  });
});