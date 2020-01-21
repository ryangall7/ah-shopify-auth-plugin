Plugin to add shopify authentication to [Actionhero](https://www.actionherojs.com/)
----------------------------------------------------------------------------------

Still early stages, would love any input!

## Configuration

To configure your Actionhero server to also run Next:

1. Add this plugin to your actionhero project `npm install ah-shopify-auth-plugin`. You should also `npm install dotenv` if you havent already. You'll need it to load your shopify credentials without committing them in a config file.

2. Include it in your `config/plugins.ts`.

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

3. Add your apps `API_KEY` and `API_SECRET` to a `.env` file
```
SHOPIFY_API_KEY=[YOUR_SHOPIFY_API_KEY]
SHOPIFY_API_SECRET=[YOUR_SHOPIFY_API_SECRET]
```

4. Add `dotenv` to your boot.js:
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function BOOT() {
    console.log("~~~ running the actionhero project directly ~~~");
    require('dotenv').config();
}
exports.BOOT = BOOT;
```

3. Add a `shopifyAuth.ts` to your `config` directory with the following:

```ts
const path = require("path");

export const DEFAULT = {
  shopifyAuth: config => {

    return {
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecret: process.env.SHOPIFY_API_SECRET,
        scopes: 'read_products',
        forwardingAddress: "https://d2935a55.ngrok.io"
    };
  }
};
```


4. In most cases change your default route in `config/servers/web.ts` to be "api" rather than "file" (this plugin only authenticates api calls)
