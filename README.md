Plugin to add [Shopify authentication](https://help.shopify.com/en/api/getting-started/authentication/oauth) to [Actionhero](https://www.actionherojs.com/)
----------------------------------------------------------------------------------

Still early stages, would love any input!

## Configuration

To configure your Actionhero server to authenicate with shopify oAuth:

1. Add this plugin to your actionhero project `npm install ah-shopify-auth-plugin`. Also, if you want to store your creditnails in a file rather than your server's ENVIRONMENT, you can `npm install dotenv`.
2. Include this plugin in your `config/plugins.ts`.

```ts
import { join } from "path";

export const DEFAULT = {
  plugins: () => {
    return {
      "ah-shopify-auth-plugin": {
        path: join(__dirname, "..", "node_modules", "ah-shopify-auth-plugin")
      }
    };
  }
};
```

3. Set the required enviornment variables, either in your ENV or `.env`.  This plugin requites `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`.
```
SHOPIFY_API_KEY=[YOUR_SHOPIFY_API_KEY]
SHOPIFY_API_SECRET=[YOUR_SHOPIFY_API_SECRET]
```

4. Add a `shopifyAuth.ts` to your `config` directory with the following:

```ts
const path = require("path");

export const DEFAULT = {
  shopifyAuth: config => {

    return {
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecret: process.env.SHOPIFY_API_SECRET,
        scopes: 'read_products',
        ignoredDirectories: ["static"] //array of ignored directories (top level only)
    };
  }
};
```

5. In most cases change your default route in `config/servers/web.ts` to be "api" rather than "file" (this plugin only authenticates api calls)

## SameSite cookies
Shopify and chrome now require cookies to be [SameSite=none](https://help.shopify.com/en/api/guides/samesite-cookies). To do this you need to add these attributes to your sessionID cookie in `config/servers/web.ts`:
```ts
...
// Settings for determining the id of an http(s) request (browser-fingerprint)
fingerprintOptions: {
  cookieKey: "sessionID",
  toSetCookie: true,
  onlyStaticElements: false,
  settings: {
    path: "/",
    expires: 3600000,
    sameSite: "None",
    secure: true
  }
},
...
```

Processing Auth Token
=====================

Auth Token and scopes are saved on the session object. Like this:

```
{
  shopifySession: {
    access_token: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    scope: 'read_products',
    shop: 'some-store.myshopify.com'
  }
}
```

If you need to do something with the Shopify authToken once a user authenticates you can overwrite the function:
```  
api.shopifyAuth.afterAuth = async (data, shopifySession) => {
    // Overwrite this function process the shopify access token after its been recieved
    log("Shopify Authorization Complete!");
    return;
}
```
the `data` object is the same `data` object passed to Actionhero actions, and the `shopifySession` is structured as above.
