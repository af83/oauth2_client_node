# OAuth2 Client in Node

## Description

  oauth2_client_node is a node library providing the bases to implement an OAuth2 client. It features a [connect](https://github.com/senchalabs/connect) middleware to ease the integration with any other components.

It implements the OAuth2 [web server schema](http://tools.ietf.org/html/draft-ietf-oauth-v2-10#section-1.4.1) as specified by the [draft 10 of the OAuth2 specification](http://tools.ietf.org/html/draft-ietf-oauth-v2-10).

This project will follow the specification evolutions, so a branch for the [draft 11](http://tools.ietf.org/html/draft-ietf-oauth-v2-11) will soon be created.


## Similar projects

oauth2_client_node is developed together with:

 - [oauth2_server_node](https://github.com/AF83/oauth2_server_node), a connect middleware featuring an OAuth2 server bases.
 - [auth_server](https://github.com/AF83/auth_server), an authentication and authorization server in node (using both oauth2_client_node and oauth2_server_node).


## Usage

There are two examples of usage in the examples directory, one using Facebook as OAuth2 server, and one using auth_server as OAuth2 server.

To create an OAuth2 client, you will need to to create an oauth2_client_node middleware using oauth2_client.connector. This method returns a connect middleware and takes as arguments:

  - config: hash containing:

    - client, hash containing:
      - base_url: The base URL of the OAuth2 client.
        Ex: http://domain.com:8080
      - process_login_url: the URL where to the OAuth2 server must redirect
        the user when authenticated.
      - login_url: the URL where the user must go to be redirected
        to OAuth2 server for authentication.
      - logout_url: the URL where the user must go so that his session is
        cleared, and he is unlogged from client.
      - default_redirection_url: default URL to redirect to after login / logout.
        Optional, default to '/'.
      - crypt_key: string, encryption key used to crypt information contained in states. This is a symmetric key and must be kept secret.
      - sign_key: string, signature key used to sign (HMAC) issued states. This is a symmetric key and must be kept secret.

    - default_server: which server to use for default login when user
      access login_url (ex: 'facebook.com').
    - servers: hash associating OAuth2 server ids (ex: "facebook.com")
      with a hash containing (for each):
      - server_authorize_endpoint: full URL, OAuth2 server token endpoint
        (ex: "https://graph.facebook.com/oauth/authorize").
      - server_token_endpoint: full url, where to check the token
        (ex: "https://graph.facebook.com/oauth/access_token").
      - client_id: the client id as registered by this OAuth2 server.
      - client_secret: shared secret between client and this OAuth2 server.

    - options: optional, hash associating OAuth2 server ids
      (ex: "facebook.com") with hash containing some options specific to the server.
      Not all servers have to be listed here, neither all options.
      Possible options:
      - valid_grant: a function which will replace the default one
        to check the grant is ok. You might want to use this shortcut if you
        have a faster way of checking than requesting the OAuth2 server
        with an HTTP request.
      - treat_access_token: a function which will replace the
        default one to do something with the access token. You will tipically
        use that function to set some info in session.
      - transform_token_response: a function which will replace
        the default one to obtain a hash containing the access_token from
        the OAuth2 server reply. This method should be provided if the
        OAuth2 server we are requesting does not return JSON encoded data.


Once set and plug, the oauth2_client middleware will catch and answer requests
aimed at the oauth2 client (login, logout and process_login endpoints).


## Dependencies

* connect
* request
* serializer

Tested with node v0.4.

## Tests

with nodetk.

## Projects using oauth2_client_node

A [wiki page](https://github.com/AF83/oauth2_client_node/wiki) lists the projects using oauth2_client_node. Don't hesitate to edit it.


## License

BSD.
