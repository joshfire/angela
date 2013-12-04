/**
 * @fileOverview Shows how to flag a spec test as "pending"
 *
 * Run the example with:
 *   angela examples/pending.spec.js
 */
/* global describe, it, pending */
describe('The not yet implemented test', function () {
  it('should be reported as pending');
  it('should be reported as pending when "pending()" is called', function () {
    pending();
  });
});
