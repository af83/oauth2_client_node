var assert = require('nodetk/testing/custom_assert')
  , tools = require('nodetk/testing/tools')
  , querystring = require('querystring')
  , client = require('../oauth2_client')
  , serializer = require('nodetk/serializer')
  ;


exports.module_init = function(callback) {
  client.config = {
    client: {
      redirect_uri: 'http://site/process'
    }
  , default_server: "test"
  , servers: {
      "test": {
        server_authorize_endpoint: 'http://oauth2server/auth'
      , client_id: 'CLIENTID'
      }
    }
  };
  client.serializer = serializer;
  callback();
};

exports.module_close = function(callback) {
  client.serializer = {};
  callback();
};


exports.tests = [

['no given state', 2, function() {
  var state = serializer.dump_str(['test', 'http://next_url', null]);
  var qs = querystring.stringify({
    client_id: 'CLIENTID'
  , redirect_uri: 'http://site/process'
  , response_type: 'code'
  , state: state
  });
  var res = tools.get_expected_redirect_res("http://oauth2server/auth?" + qs);
  client.redirects_for_login('test', res, 'http://next_url');
}],

['given state', 2, function() {
  var state = serializer.dump_str(['test', 'http://next_url', {"key": "val"}]);
  var qs = querystring.stringify({
    client_id: 'CLIENTID'
  , redirect_uri: 'http://site/process'
  , response_type: 'code'
  , state: state
  });
  var res = tools.get_expected_redirect_res("http://oauth2server/auth?" + qs);
  client.redirects_for_login('test', res, 'http://next_url', {'key': 'val'});
}],

];

