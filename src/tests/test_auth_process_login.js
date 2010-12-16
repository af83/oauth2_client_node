var assert = require('nodetk/testing/custom_assert')
  , client = require('../oauth2_client')
  , tools = require('nodetk/testing/tools')
  ;


// Reset some mocked/fucked stuff:
var ORIGIN = {};
var to_save = ['valid_grant', 'treat_access_token'];
to_save.forEach(function(fct_name) {
  ORIGIN[fct_name] = client[fct_name];
});
exports.module_close = function(callback) {
  to_save.forEach(function(fct_name) {
    client[fct_name] = ORIGIN[fct_name];
  });
  callback();
};


exports.tests = [

['Missing code', 3, function() {
  var req = {url: '/'};
  var res = tools.get_expected_res(400);
  client.auth_process_login(req, res);
}],

['Invalid grant (no error)', 3, function() {
  client.valid_grant = function(_, callback){callback(null)};
  var req = {url: '/?code=somecode'};
  var res = tools.get_expected_res(400);
  client.auth_process_login(req, res);
}],

['Invalid grant (error)', 3, function() {
  client.valid_grant = function(_, _, fallback){fallback('error')};
  var req = {url: '/?code=somecode'};
  var res = tools.get_expected_res(500);
  client.auth_process_login(req, res);
}],

['Valid grant, treat_access_token fallback', 3, function() {
  client.valid_grant = function(_, callback){callback('token')};
  client.treat_access_token = function(_, _, _, _, fallback) {fallback('err')};
  var req = {url: '/?code=somecode'};
  var res = tools.get_expected_res(500);
  client.auth_process_login(req, res);
}],

['Valid grant, invalid params.state', 3, function() {
  client.valid_grant = function(_, callback){callback('token')};
  client.treat_access_token = function(_, _, _, callback) {callback()};
  var req = {url: '/?code=somecode&state=titi'};
  var res = tools.get_expected_res(500);
  client.auth_process_login(req, res);
}],

['Valid grant, next in params.state', 2, function() {
  client.valid_grant = function(_, callback){callback('token')};
  client.treat_access_token = function(_, _, _, callback) {callback()};
  var req = {url: '/?code=somecode&state={"next":"next_val"}'};
  var res = tools.get_expected_redirect_res("next_val");
  client.auth_process_login(req, res);
}],

['Valid grant, no next in params.state', 2, function() {
  client._set_config({
    base_url: 'http://site.com'
  , default_redirection_url: '/'
  });
  client.valid_grant = function(_, callback){callback('token')};
  client.treat_access_token = function(_, _, _, callback) {callback()};
  var req = {url: '/?code=somecode&state={}'};
  var res = tools.get_expected_redirect_res("http://site.com/");
  client.auth_process_login(req, res);
}],

];

