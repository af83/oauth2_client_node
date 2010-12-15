var assert = require('nodetk/testing/custom_assert')
  , querystring = require('querystring')
  , client = require('../oauth2_client')
  , get_expected_redirect_res = require('./tools').get_expected_redirect_res
  ;


exports.module_init = function(callback) {
  client._set_config({
    server_authorize_endpoint: 'http://oauth2server/auth'
  , client_id: 'CLIENTID'
  , redirect_uri: 'http://site/process'
  });
  callback();
};


exports.tests = [

['no next_url', 2, function() {
  var qs = querystring.stringify({
    client_id: 'CLIENTID'
  , redirect_uri: 'http://site/process'
  , response_type: 'code'
  });
  var res = get_expected_redirect_res("http://oauth2server/auth?" + qs);
  client.redirects_for_login(res);
}],

['next_url', 2, function() {
  var next = 'http://site/next_url';
  var qs = querystring.stringify({
    client_id: 'CLIENTID'
  , redirect_uri: 'http://site/process'
  , response_type: 'code'
  , state: JSON.stringify({next: next})
  });
  var res = get_expected_redirect_res("http://oauth2server/auth?" + qs);
  client.redirects_for_login(res, next);
}],

];

