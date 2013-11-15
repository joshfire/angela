/*global describe, it, expect*/
describe('A sweet test', function () {
  it('passes when matcher is available', function () {
    expect('sweet').toBeSweet();
  });
});
