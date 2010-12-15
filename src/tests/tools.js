var assert = require('nodetk/testing/custom_assert');


exports.get_expected_res = function(expected_status_code) {
  /* Returns a res object making 3 asserts. 
   * Check the status code is the one expected,
   * content-type is text/plain and body is not empty.
   */
  return {
    writeHead: function(status_code, headers) {
      assert.equal(status_code, expected_status_code);
      assert.deepEqual(headers, {'Content-Type': 'text/plain'});
    }
  , end: function(body) {
      assert.ok(body);
    }
  , write: function() {}
  };
};


exports.get_expected_redirect_res = function(location_) {
  /* Idem for redirect. 2 asserts are done. */
  return {
    writeHead: function(status_code, headers) {
     assert.equal(status_code, 303);
     assert.equal(headers['Location'], location_);
    }
  , end: function(){}
  }
};

