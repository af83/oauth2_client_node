var assert = require('nodetk/testing/custom_assert')
  , client = require('../lib/oauth2_client')
  , tools = require('nodetk/testing/tools')
  , serializer = require('nodetk/serializer')
  ;


// Reset some mocked/faked stuff:
var ORIGIN = {};
var to_save = ['valid_grant', 'treat_access_token', 'serializer'];
to_save.forEach(function(fct_name) {
  ORIGIN[fct_name] = client[fct_name];
});
exports.module_close = function(callback) {
  to_save.forEach(function(fct_name) {
    client[fct_name] = ORIGIN[fct_name];
  });
  callback();
};

exports.module_init = function(callback) {
  client.methods = {'serverid': client};
  client.serializer = serializer;
  callback();
};


exports.tests = [

['Missing code', 3, function() {
  var req = {url: '/'};
  var res = tools.get_expected_res(400);
  client.auth_process_login(req, res);
}],

['Missing state', 3, function() {
  var req = {url: '/?code=somecode'};
  var res = tools.get_expected_res(400);
  client.auth_process_login(req, res);
}],

['Invalid state', 3, function() {
  var req = {url: '/?code=somecode&state=toto'};
  var res = tools.get_expected_res(400);
  client.auth_process_login(req, res);
}],

['Invalid grant (no error)', 3, function() {
  client.valid_grant = function(_, _, callback){callback(null)};
  state = serializer.dump_str(['serverid', 'nexturl', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_res(400);
  client.auth_process_login(req, res);
}],

['Invalid grant (error)', 3, function() {
  client.valid_grant = function(_, _, _, fallback){fallback('error')};
  var state = serializer.dump_str(['serverid', 'nexturl', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_res(500);
  client.auth_process_login(req, res);
}],

['Valid grant, treat_access_token fallback', 3, function() {
  client.valid_grant = function(_, _, callback){callback('token')};
  client.treat_access_token = function(_, _, _, _, fallback) {fallback('err')};
  var state = serializer.dump_str(['serverid', 'nexturl', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_res(500);
  client.auth_process_login(req, res);
}],

['Valid grant', 2, function() {
  client.valid_grant = function(_, _, callback){callback('token')};
  client.treat_access_token = function(_, _, _, callback) {callback()};
  var state = serializer.dump_str(['serverid', 'next_url', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_redirect_res("next_url");
  client.auth_process_login(req, res);
}],

];

