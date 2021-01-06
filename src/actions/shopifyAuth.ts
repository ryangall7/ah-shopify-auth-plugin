import { Initializer, Action, api, utils, route, config, log, cache } from "actionhero";
import * as nonce from "nonce";

abstract class AuthenticationAction extends Action {
  skipAuthentication: boolean;
}

export class Auth extends AuthenticationAction {
  constructor() {
    super();
    this.name = "shopify:auth";
    this.description = "Check Shopify Authentication";
    this.outputExample = {
      auth: true,
      shop: "shop.myshopify.com"
    };
    this.skipAuthentication = true;
    this.inputs = {
      hmac: { required : true },
      shop: { required : true },
      timestamp: { required : false }
    }
  }

  async run(data) {
    
    const { apiKey, scopes } = config.shopifyAuth;

    const { host }  = data.connection.rawConnection.req.headers;

    const { hmac, shop, timestamp } = data.connection.params;

    console.log("auth", data.connection.params);

    if (shop) {

      const cookies = utils.parseCookies(data.connection.rawConnection.req)

      const state = nonce()();
      const redirectUri = 'https://'+ host + '/auth/inline' + data.connection.rawConnection.parsedURL.search;

      log("authorizing app on `" + shop + "` with scopes `" + scopes + "`;");
      //disable automatic data rendering
      data.toRender = false;
      //  data.connection.rawConnection.responseHeaders.push(['Location', installUrl]);
      data.connection.rawConnection.responseHeaders.push(['Content-Type', 'text/html'])
      data.connection.rawConnection.responseHttpCode = 200;

      const html = api.shopifyAuth.topLevelRedirectScript(shop, redirectUri, apiKey);
      data.connection.rawConnection.res.end(html);
      data.connection.destroy();
    } else {
      data.connection.rawConnection.responseHttpCode = 400;
    }
  }
}

export class AuthInline extends AuthenticationAction {
  constructor() {
    super();
    this.name = "shopify:authInline";
    this.description = "Check Shopify Authentication";
    this.outputExample = {
      auth: true,
      shop: "shop.myshopify.com"
    };
    this.skipAuthentication = true;
    this.inputs = {
      hmac: { required : true },
      shop: { required : true },
      timestamp: { required : false }
    }
  }

  async run({ session, actionTemplate, connection, toRender }) {
    const { apiKey, scopes } = config.shopifyAuth;

    const { hmac, shop, timestamp } = connection.params;

    const { host }  = connection.rawConnection.req.headers;

    if (shop) {

      const cookies = utils.parseCookies(connection.rawConnection.req)

      const state = nonce()();
      const redirectUri = "https://" + host + '/auth/callback';
      const installUrl = 'https://' + shop +
        '/admin/oauth/authorize?client_id=' + apiKey +
        '&scope=' + scopes +
        '&state=' + state +
        '&redirect_uri=' + redirectUri;

      log("authorizing app on `" + shop + "` with scopes `" + scopes + "`;");

      connection.rawConnection.responseHeaders.push(['Location', installUrl]);
      connection.rawConnection.responseHeaders.push(['Set-cookie', "state=" + state]);
      connection.rawConnection.responseHttpCode = 302;

    } else {
      connection.rawConnection.responseHttpCode = 400;
    }
  }
}


export class AuthCallback extends AuthenticationAction {
  constructor() {
    super();
    this.name = "shopify:authCallback";
    this.description = "Check Shopify Authentication";
    this.outputExample = {
      auth: true,
      shop: "shop.myshopify.com"
    };
    this.skipAuthentication = true;
    this.inputs = {
      hmac: { required : true },
      shop: { required : true },
      code: { required : true },
      state: { required : true }
    }
  }

  async run(data) {
    const { connection, response } = data
    const { state, hmac, code, shop } = connection.params
    const stateCookie = connection.rawConnection.cookies.state;

    console.log("auth?", data);

    if (state !== stateCookie) {
      connection.rawConnection.responseHttpCode = 400;
      response.error = 'Request origin cannot be verified';
    }

    if (shop && hmac && code) {
      const { query } = connection.rawConnection.parsedURL;
      const validHmac = await api.shopifyAuth.verifyHmac(hmac, query);

      if (!validHmac) {
        connection.rawConnection.responseHttpCode = 400;
        response.error = 'HMAC validation failed';
        return;
      }

      const accessTokenResponse = await api.shopifyAuth.getAccessToken(shop, code);

      if(accessTokenResponse){
        const saveResponse = await api.shopifyAuth.createShopifySession(connection, {...accessTokenResponse, shop});
        const afterAuth = await api.shopifyAuth.afterAuth(data, {...accessTokenResponse, shop});

        connection.rawConnection.responseHeaders.push(['Set-cookie', "shopOrigin=" + shop + "; Path=/; Secure; SameSite=None"]);
        connection.rawConnection.responseHeaders.push(['Location', "/?hmac=" + hmac]);
        connection.rawConnection.responseHttpCode = 302;
      }else{
        connection.rawConnection.responseHttpCode = 500;
        response.error = 'Error getting permanent access token from shopify';
      }
    } else {
      connection.rawConnection.responseHttpCode = 400;
      response.error = 'Required parameters missing';
    }
  }
}

export class AuthCheck extends Action {
  constructor() {
    super();
    this.name = "shopify:authCheck";
    this.description = "Check Shopify Authentication";
    authenticated: true
    this.outputExample = {
      auth: true,
      shop: "shop.myshopify.com"
    };
  }

  async run({ session, response }) {

    console.log("check");

    response.randomNumber = Math.random();
  }
}
