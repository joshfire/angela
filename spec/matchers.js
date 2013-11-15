/*global beforeEach, addMatchers*/
beforeEach(function () {
  addMatchers({
    toBeSweet: function () {
      return {
        compare: function (actual) {
          var result = { pass: false };
          result.pass = (actual === 'sweet');
          return result;
        }
      };
    }
  });
});
