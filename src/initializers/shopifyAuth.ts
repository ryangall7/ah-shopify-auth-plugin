import { Initializer, cache, api, action, route, config, log } from "actionhero";
import * as nonce from "nonce";
import * as crypto from "crypto";
import * as querystring from "querystring";
import * as fetch from "node-fetch";

export class ShopifyAuthInitializer extends Initializer {
  constructor() {
    super();
    this.name = "shopifyAuthInitializer";
    this.loadPriority = 999;
    this.startPriority = 999;
    this.stopPriority = 999;
  }

  async initialize () {

    if(!config.shopifyAuth){
      log("Please add `shopifyAuth` config to use `ah-shopify-auth-plugin`", "error")
      return;
    }

    const { ignoredDirectories, apiKey, apiSecret, scopes, forwardingAddress } = config.shopifyAuth;

    if(!apiKey || !apiSecret){
      log("Please add `apiKey` and `apiSecret` in .env or config to use `ah-shopify-auth-plugin`", "error")
      return;
    }

    api.shopifyAuth = {
      ...api.shopifyAuth,
      prefix: 'shopifySession:',
      ttl: 60 * 60 * 24, // 1 day
    };

    api.shopifyAuth.middleware = {
        name: this.name,
        global: true,
        preProcessor: async ({session, actionTemplate, params, connection }) => {

          session.shopifySession = await api.shopifyAuth.loadShopifySession(connection);

          //check for ignored directories
          var skip = false;
          let {path} = connection.rawConnection.req.uri;
          ignoredDirectories.map(( dirrectory ) => {
            if(path.indexOf(dirrectory) == 1){
              skip = true;
            }
          });
          if(skip) return;

          if(actionTemplate.skipAuthentication) return;

          const { hmac, shop, timestamp } = params;
          //check for session
          if(session.shopifySession){
            if(shop && shop != session.shopifySession.shop){
              const installUrl = "/auth?hmac=" + hmac + "&shop=" + shop + "&timestamp=" + timestamp;
              connection.rawConnection.responseHeaders.push(['Location', installUrl]);
              connection.rawConnection.responseHttpCode = 302;
            }else{
              return;
            }
          }

          console.log("no shopify session");

          if (shop) {
            const installUrl = "/auth?hmac=" + hmac + "&shop=" + shop + "&timestamp=" + timestamp;
            connection.rawConnection.responseHeaders.push(['Location', installUrl]);
            connection.rawConnection.responseHttpCode = 302;
          }else{
            connection.rawConnection.res.end("Request missing shop");
            connection.rawConnection.responseHttpCode = 403;
            connection.destroy();
          }

       }
    }

    api.shopifyAuth.loadShopifySession = async (connection) => {
      const key = api.shopifyAuth.prefix + connection.fingerprint
      try{
        const data = await cache.load(key)
        if (!data) { return false }
        const value = JSON.parse(data.value);
        return value;
      }catch(e){
        return false;
      }
    },

    api.shopifyAuth.createShopifySession = async (connection, auth) => {
      const key = api.shopifyAuth.prefix + connection.fingerprint

      await cache.save(key, JSON.stringify(auth), api.shopifyAuth.ttl)
      return auth;
    },

    api.shopifyAuth.destroyShopifySession = async (connection) => {
      const key = api.shopifyAuth.prefix + connection.fingerprint
      await cache.destroy(key)
    },

    api.shopifyAuth.verifyHmac = async (hmac, query) => {

        const {hmac: _hmac, signature: _signature, ...map} = query;

        const orderedMap = Object.keys(map)
          .sort((value1, value2) => value1.localeCompare(value2))
          .reduce((accum, key) => {
            accum[key] = map[key];
            return accum;
          }, {});

        const message = querystring.stringify(orderedMap);

        const providedHmac = Buffer.from(hmac, 'utf-8');
        const generatedHash = Buffer.from(
          crypto
            .createHmac('sha256', apiSecret)
            .update(message)
            .digest('hex'),
            'utf-8'
          );

        let hashEquals = false;

        try {
          hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
        } catch (e) {
          hashEquals = false;
        };

        if (!hashEquals) {
          return false;
        }

        return true;
    }

    api.shopifyAuth.getAccessToken = async (shop, code) => {
      // DONE: Exchange temporary code for a permanent access token
      const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
      const accessTokenPayload = {
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      };

      const response = await fetch(accessTokenRequestUrl, {
        method: 'POST',
        headers: {
           'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: querystring.stringify(accessTokenPayload)
      });

      if(response.status == 200){
        return await response.json();
      }else{
        log("Error getting permanent access token from shopify")
        return false;
      }
    }

    api.shopifyAuth.topLevelRedirectScript = (origin, redirectTo) => {
      log(`Shopify auth toplevel redirect to ${redirectTo}`);

      return `
        <script type="text/javascript">
          document.addEventListener('DOMContentLoaded', function() {
            if (window.top === window.self) {
              // If the current window is the 'parent', change the URL by setting location.href
              window.location.href = '${redirectTo}';
            } else {
              // If the current window is the 'child', change the parent's URL with postMessage
              data = JSON.stringify({
                message: 'Shopify.API.remoteRedirect',
                data: { location: '${redirectTo}' }
              });
              window.parent.postMessage(data, '${origin}');
            }
          });
        </script>
      `;
    }

    api.shopifyAuth.afterAuth = async (data, accessToken) => {
      // Overwrite this function process the shopify access token after its been recieved
      log("Shopify Authorization Complete!");
      return;
    }

    route.registerRoute("get", "/auth", "shopify:auth");
    route.registerRoute("get", "/auth/inline", "shopify:authInline");
    route.registerRoute("get", "/auth/callback", "shopify:authCallback");

    action.addMiddleware(api.shopifyAuth.middleware);

  }
}
