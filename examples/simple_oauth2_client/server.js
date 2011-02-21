var app = require('./app')
  , oauth2_client = require('../../')
  , connect = require('connect')
  , sessions = require('cookie-sessions')
  , request = require('request')
  ;

var base_url = 'http://127.0.0.1:7071';
var config = {
  oauth2_client: {
    client: {
      base_url: base_url,
      process_login_url: '/login/process/',
      redirect_uri: base_url + '/login/process/',
      login_url: '/login',
      logout_url: '/logout',
      default_redirection_url: '/',
    },
    default_server: "auth_server",
    servers: {
      "auth_server": {
        server_authorize_endpoint: 'http://localhost:7070/oauth2/authorize',
        server_token_endpoint: 'http://localhost:7070/oauth2/token',

        client_id: "4d540f5d1277275252000005", // TODO: define this before running
        client_secret: 'some secret string',
        name: 'geeks'
      }
    }
  }
};

var oauth2_client_options = {
  "auth_server": {
    // To get info from access_token and set them in session
    treat_access_token: function(access_token, req, res, callback) {
      request.get({uri: 'http://localhost:7070/portable_contacts/@me/@self',
                   headers: {"Authorization" : "OAuth "+ access_token.token.access_token}},
                  function(status_code, headers, data) {
                    console.log(data);
                    var info = JSON.parse(data);
                    req.session.user_email = info.entry[0].displayName;
                    callback();
                  });
    }
  }
};

var client = oauth2_client.createClient(config.oauth2_client, oauth2_client_options);

var server = connect.createServer(
  sessions({secret: '123abc', session_key: 'session'})
, client.connector()
, app.connector()
);

var serve = function(port, callback) {
  server.listen(port, callback);
};

if(process.argv[1] == __filename) {
  if(!config.oauth2_client.servers['auth_server'].client_id) {
    console.log('You must set a oauth2 client id in config (cf. README).');
    process.exit(1);
  }
  serve(7071, function() {
    console.log('OAuth2 client server listening on http://localhost:7071');
  });
}
