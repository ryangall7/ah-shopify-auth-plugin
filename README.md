Plugin to add shopify authentication to [Actionhero](https://www.actionherojs.com/)
----------------------------------------------------------------------------------

Still early stages, would love any input!

## Configuration

To configure your Actionhero server to also run Next:

1. Add this plugin to your actionhero project `npm install ah-shopify-auth-plugin`

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

3. Add a `shopifyAuth.ts` to your `config` directory with the following:

```ts
const path = require("path");

export const DEFAULT = {
  shopifyAuth: config => {

    return {
        apiKey: YOUR_SHOPIFY_APP_API_KEY,
        apiSecret: YOUR_SHOPIFY_APP_API_SECRET,
        scopes: ['read_products'], // array with shopify scopes
        forwardingAddress: "https://d2935a55.ngrok.io"
    };
  }
};
```

4. In most cases change your default route in `config/servers/web.ts` to be "api" rather than "file" (this plugin only authenticates api calls)
