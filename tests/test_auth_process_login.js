var assert = require('nodetk/testing/custom_assert')
  , tools = require('nodetk/testing/tools')
  , oauth2_client = require('../lib/oauth2_client')
  , serializer = require('serializer')
  ;

var client;

exports.setup = function(callback) {
  client = oauth2_client.createClient({
    client: {},
    servers: {
      'serverid': {
//        valid_grant: function(_, _, callback) {
//          callback({});
//        }
      }
    }
  });
  //client.methods = {'serverid': client};
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
  var client = oauth2_client.createClient({
    client: {},
    servers: {'serverid': {}}},
   {'serverid': {
     valid_grant: function(_, _, callback) {callback(null);}
   }}
  );
  client.serializer = serializer;
  state = serializer.stringify(['serverid', 'nexturl', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_res(400);
  client.auth_process_login(req, res);
}],

['Invalid grant (error)', 3, function() {
  var client = oauth2_client.createClient({
    client: {},
    servers: {'serverid': {}}},
    {'serverid':{
      valid_grant: function(_, _, callback){callback('error')}}}
  );
  client.serializer = serializer;
  var state = serializer.stringify(['serverid', 'nexturl', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_res(500);
  client.auth_process_login(req, res);
}],

['Valid grant, treat_access_token fallback', 3, function() {
  var client = oauth2_client.createClient({
    client: {},
    servers: {'serverid': {}}},
    {'serverid':{
      valid_grant: function(_, _, callback){callback('token')},
      treat_access_token: function(_, _, _, callback) {callback('err')}}}
  );
  client.serializer = serializer;
  var state = serializer.stringify(['serverid', 'nexturl', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_res(500);
  client.auth_process_login(req, res);
}],

['Valid grant', 2, function() {
  var client = oauth2_client.createClient({
    client: {},
    servers: {'serverid': {}}},
    {'serverid':{
      valid_grant: function(_, _, callback){callback(null, 'token')},
      treat_access_token: function(_, _, _, callback) {callback()}}}
  );
  client.serializer = serializer;
  var state = serializer.stringify(['serverid', 'next_url', null]);
  var req = {url: '/?code=somecode&state='+state};
  var res = tools.get_expected_redirect_res("next_url");
  client.auth_process_login(req, res);
}]

];
