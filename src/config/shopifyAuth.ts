const path = require("path");

export const DEFAULT = {
  shopifyAuth: config => {

    return {
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecret: process.env.SHOPIFY_API_SECRET,
        scopes: 'read_products',
        forwardingAddress: "https://ea0be9c6.ngrok.io"
    };
  }
};
