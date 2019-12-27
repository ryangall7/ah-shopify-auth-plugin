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
