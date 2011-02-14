var assert = require('nodetk/testing/custom_assert');
var client = require('../lib/oauth2_client');


exports.tests = [

['JSON.parse is called and its result returned', 2, function() {
  var original_parse = JSON.parse
    , arg = "some body"
    , res = "some result"
    , res2
    ;
  JSON.parse = function(arg2) {
    assert.equal(arg, arg2);
    return res;
  };
  res2 = client.transform_token_response(arg);
  JSON.parse = original_parse;
  assert.equal(res, res2);
}],

];

