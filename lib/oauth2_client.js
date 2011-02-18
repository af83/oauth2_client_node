/*
 * OAuth2 client module, defining:
 *  - a connect middleware, that allows your application to act as a OAuth2
 *    client.
 *  - the method redirects_for_login (connector method must have been called
 *    before), that redirects the user to the OAuth2 server for authentication.
 *
 */
var URL = require('url')
  , querystring = require('querystring')
  , serializer = require('serializer')
  , router = require('connect').router
  , request = require('request')
  ;

function redirect(res, url) {
  res.writeHead(303, {'Location': url});
  res.end();
}

function server_error(res, err) {
  res.writeHead(500, {'Content-Type': 'text/plain'});
  if(typeof err == "string") res.end(err);
  else {
    res.write('An error has occured: ' + err.message);
    res.write('\n\n');
    res.end(err.stack);
  }
}

function OAuth2Client(conf, options) {
  this.config = conf;
  this.createSerializer();

  // Build hash associating serverid and custom|default methods.
  this.methods = {};
  var self = this;
  for(var serverid in conf.servers) {
    var smethods = this.methods[serverid] = {};
    var soptions = options[serverid] || {};
    ['valid_grant'
   , 'treat_access_token'
   , 'transform_token_response'
    ].forEach(function(fctName) {
      smethods[fctName] = soptions[fctName] || self[fctName].bind(self);
    });
  }
}
OAuth2Client.prototype = {
  createSerializer: function() {
    var cconf = this.config.client;
    this.serializer = serializer.createSecureSerializer(cconf.crypt_key, cconf.sign_key);
  },
  /**
   * Given body answer to the HTTP request to obtain the access_token,
   * returns a JSON hash containing:
   *  - access_token
   *  - expires_in (optional)
   *  - refresh_token (optional)
   *
   * If no access_token in there, return null;
   *
   */
  transform_token_response : function(body) {
    return JSON.parse(body);
  },

  /**
   * Valid the grant given by user requesting the OAuth2 server
   * at OAuth2 token endpoint.
   *
   * Arguments:
   *    - data: hash containing:
   *      - oauth2_server_id: string, the OAuth2 server is (ex: "facebook.com").
   *      - next_url: string, the next_url associated with the OAuth2 request.
   *      - state: hash, state associated with the OAuth2 request.
   *    - code: the authorization code given by OAuth2 server to user.
   *    - callback: function to be called once grant is validated/rejected.
   *      Called with the access_token returned by OAuth2 server as first
   *      parameter. If given token might be null, meaning it was rejected
   *      by OAuth2 server.
   *    - fallback: function to be called in case of error, with err argument.
   *
   */
  valid_grant : function(data, code, callback, fallback) {
    var self = this;
    var cconfig = this.config.client;
    var sconfig = this.config.servers[data.oauth2_server_id];
    request.post({uri: sconfig.server_token_endpoint,
                  headers: {'content-type': 'application/x-www-form-urlencoded'},
                  body: querystring.stringify({
                    grant_type: "authorization_code",
                    client_id: sconfig.client_id,
                    code: code,
                    client_secret: sconfig.client_secret,
                    redirect_uri: cconfig.redirect_uri
                  })
                 }, function(error, response, body) {
                   if (!error && response.statusCode == 200) {
                     try {
                       var methods = self.methods[data.oauth2_server_id];
                       var token = methods.transform_token_response(body)
                       callback(token);
                     } catch(err) {
                       fallback(err);
                     }
                   } else {
                     // TODO: check if error code indicates problem on the client,
                     // and if so, calls fallback(err) instead of callback(null).
                     console.error(error, body);
                     callback(null);
                   }
                 });
  },

  /**
   * Make something with the access_token.
   *
   * This is the default implementation provided by this client.
   * This implementation does nothing, and the exact way this access_token
   * should be used is not specified by the OAuth2 spec (only how it should
   * be passed to resource provider).
   *
   * Arguments:
   *  - data: hash containing:
   *    - token: the body returned by the server in json.
   *      The oauth_token param value to send will be: data.token.access_token.
   *    - next_url: the url to redirect to after the OAuth2 process is done.
   *    - state: hash, state associated with the OAuth2 process.
   *  - req
   *  - res
   *  - callback: to be called when action is done. The request will be blocked
   *    while this callback has not been called (so that the session can be
   *    updated...).
   *
   */
  treat_access_token: function(data, req, res, callback, fallback) {
    callback();
  },

  /**
   * Check the grant given by user to login in authserver is a good one.
   *
   * Arguments:
   *  - req
   *  - res
   */
  auth_process_login: function(req, res) {
    var params = URL.parse(req.url, true).query
      , code = params.code
      , state = params.state
    ;

    if(!code) {
      res.writeHead(400, {'Content-Type': 'text/plain'});
      return res.end('The "code" parameter is missing.');
    }
    if(!state) {
      res.writeHead(400, {'Content-Type': 'text/plain'});
      return res.end('The "state" parameter is missing.');
    }
    try {
      state = this.serializer.parse(state);
    } catch(err) {
      res.writeHead(400, {'Content-Type': 'text/plain'});
      return res.end('The "state" parameter is invalid.');
    }
    var data = {
      oauth2_server_id: state[0]
      , next_url: state[1]
      , state: state[2]
    }
    var methods = this.methods[data.oauth2_server_id];
    methods.valid_grant(data, code, function(token) {
      if(!token) {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('Invalid grant.');
        return;
      }
      data.token = token;
      methods.treat_access_token(data, req, res, function() {
        redirect(res, data.next_url);
      }, function(err){server_error(res, err)});
    }, function(err){server_error(res, err)});
  },

  /**
   * Redirects the user to OAuth2 server for authentication.
   *
   * Arguments:
   *  - oauth2_server_id: OAuth2 server identification (ex: "facebook.com").
   *  - res
   *  - next_url: an url to redirect to once the process is complete.
   *  - state: optional, a hash containing info you want to retrieve at the end
   *    of the process.
   */
  redirects_for_login: function(oauth2_server_id, res, next_url, state) {
    var sconfig = this.config.servers[oauth2_server_id];
    var cconfig = this.config.client;
    var data = {
      client_id: sconfig.client_id,
      redirect_uri: cconfig.redirect_uri,
      response_type: 'code',
      state: this.serializer.stringify([oauth2_server_id, next_url, state || null])
    };
    var url = sconfig.server_authorize_endpoint +'?'+ querystring.stringify(data);
    redirect(res, url);
  },

  /**
   * Returns value of next url query parameter if present, default otherwise.
   * The next query parameter should not contain the domain, the result will.
   */
  nexturl_query: function(req, params) {
    if(!params) {
      params = URL.parse(req.url, true).query;
    }
    var cconfig = this.config.client;
    var next = params.next || cconfig.default_redirection_url;
    var url = cconfig.base_url + next;
    return url;
  },

  /**
   * Logout the eventual logged in user.
   */
  logout: function(req, res) {
    req.session = {};
    redirect(res, this.nexturl_query(req));
  },

  /**
   * Triggers redirects_for_login with next param if present in url query.
   */
  login: function(req, res) {
    var params = URL.parse(req.url, true).query;
    var oauth2_server_id = params.provider || this.config.default_server;
    var next_url = this.nexturl_query(req, params);
    this.redirects_for_login(oauth2_server_id, res, next_url);
  },

  /**
   * Returns OAuth2 client connect middleware.
   *
   * This middleware will intercep requests aiming at OAuth2 client
   * and treat them.
   */
  connector: function() {
    var client = this;
    var cconf = this.config.client;

    return router(function(app) {
      app.get(cconf.process_login_url, client.auth_process_login.bind(client));
      app.get(cconf.login_url, client.login.bind(client));
      app.get(cconf.logout_url, client.logout.bind(client));
    });
  }
};

/**
 * Returns OAuth2 client
 *
 * Arguments:
 *  - config: hash containing:
 *
 *    - client, hash containing:
 *      - base_url: The base URL of the OAuth2 client.
 *        Ex: http://domain.com:8080
 *      - process_login_url: the URL where to the OAuth2 server must redirect
 *        the user when authenticated.
 *      - login_url: the URL where the user must go to be redirected
 *        to OAuth2 server for authentication.
 *      - logout_url: the URL where the user must go so that his session is
 *        cleared, and he is unlogged from client.
 *      - default_redirection_url: default URL to redirect to after login / logout.
 *        Optional, default to '/'.
 *      - crypt_key: string, encryption key used to crypt information
 *        contained in the states.
 *        This is a symmetric key and must be kept secret.
 *      - sign_key: string, signature key used to sign (HMAC) issued states.
 *        This is a symmetric key and must be kept secret.
 *
 *    - default_server: which server to use for default login when user
 *      access login_url (ex: 'facebook.com').
 *    - servers: hash associating OAuth2 server ids (ex: "facebook.com")
 *      with a hash containing (for each):
 *      - server_authorize_endpoint: full URL, OAuth2 server token endpoint
 *        (ex: "https://graph.facebook.com/oauth/authorize").
 *      - server_token_endpoint: full url, where to check the token
 *        (ex: "https://graph.facebook.com/oauth/access_token").
 *      - client_id: the client id as registered by this OAuth2 server.
 *      - client_secret: shared secret between client and this OAuth2 server.
 *
 *  - options: optional, hash associating OAuth2 server ids
 *    (ex: "facebook.com") with hash containing some options specific to the server.
 *    Not all servers have to be listed here, neither all options.
 *    Possible options:
 *    - valid_grant: a function which will replace the default one
 *      to check the grant is ok. You might want to use this shortcut if you
 *      have a faster way of checking than requesting the OAuth2 server
 *      with an HTTP request.
 *    - treat_access_token: a function which will replace the
 *      default one to do something with the access token. You will tipically
 *      use that function to set some info in session.
 *    - transform_token_response: a function which will replace
 *      the default one to obtain a hash containing the access_token from
 *      the OAuth2 server reply. This method should be provided if the
 *      OAuth2 server we are requesting does not return JSON encoded data.
 *
 */
function createClient(conf, options) {
  conf.default_redirection_url = conf.default_redirection_url || '/';
  options = options || {};
  return new OAuth2Client(conf, options);
}

exports.createClient = createClient;
