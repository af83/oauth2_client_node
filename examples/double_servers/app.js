var URL = require('url');


var app = function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var name = req.session.user_name;
  var loginout = null;
  if(!name) {
    name = 'anonymous';
    loginout = '<div><a href="/login?provider=facebook.com">Login with Facebook</a></div>';
    loginout += '<div><a href="/login?provider=auth_server">Login with AuthServer</a></div>';
  }
  else {
    loginout = '<a href="/logout">Logout</a>';
  }
  res.end('Hello '+ name +'!<br />'+loginout);
};


exports.connector = function() {
  return function(req, res, next) {
    var url = URL.parse(req.url);
    if(url.pathname == "/") app(req, res);
    else next();
  };
}

