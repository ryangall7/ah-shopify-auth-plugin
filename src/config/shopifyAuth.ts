const path = require("path");

export const DEFAULT = {
  shopifyAuth: config => {

    return {
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecret: process.env.SHOPIFY_API_SECRET,
        scopes: 'read_products',
        forwardingAddress: "https://b1056d5c.ngrok.io",
        ignoredDirectories: ["static"]
    };
  }
};
