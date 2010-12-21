var assert = require('nodetk/testing/custom_assert')
  , client = require('../oauth2_client')

  , extend = require('nodetk/utils').extend
  , web = require('nodetk/web')
  ;

// Some config for the client:
var config = {
  client: {
    redirect_uri: 'REDIRECT_URI'
  }
, default_server: 'serverid'
, servers: {
    'serverid': {
      client_id: "CLIENT_ID"
    , client_secret: "CLIENT_SECRET"
    }
  }
};
client.config = config;

// Reinit stuff that whould have been mocked/faked...
var original_post = web.POST;
exports.module_close = function(callback) {
  web.POST = original_post;
  callback();
};

exports.tests = [

['Oauth2 client should HTTP request OAuth2 server with right parameters', 1,
function() {
  var expected_sent_params = {
    code: "CODE"
  , grant_type: "authorization_code"
  , client_id: "CLIENT_ID"
  , client_secret: "CLIENT_SECRET"
  , redirect_uri: 'REDIRECT_URI'
  };
  web.POST = function(url, params, callback) {
    assert.deepEqual(params, expected_sent_params)
  };
  client.valid_grant('serverid', 'CODE', null, null);
}],

['OAuth2 server replies 400', 1, function() {
  // Callback must be called with null as token
  web.POST = function(_, _, callback) {callback(400, {}, '')};
  client.valid_grant('serverid', "some code", function(token) {
    assert.equal(token, null);    
  }, function() {
    assert.ok(false, 'Should not be called');
  });
}],

['OAuth2 server replies 200, grant valid, invalid answer', 1, function() {
  web.POST = function(_, _, callback) {callback(200, {}, 'invalid answer')};
  client.valid_grant('serverid', 'some code', function() {
    assert.ok(false, 'Should not be called');
  }, function(err) {
    assert.ok(err);
  });
}],

['OAuth2 server replies 200, grant valid, valid answer', 1, function() {
  var data = {access_token: 'sometoken'};
  web.POST = function(_, _, callback) {
    callback(200, {}, JSON.stringify(data));
  };
  client.valid_grant('serverid', 'code', function(token) {
    assert.deepEqual(data, token);
  }, function() {
    assert.ok(false, 'Should not be called');
  });
}],

];

