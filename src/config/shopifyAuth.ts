const path = require("path");
require('dotenv').config();

export const DEFAULT = {
  shopifyAuth: config => {

    return {
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecret: process.env.SHOPIFY_API_SECRET,
        scopes: 'read_products',
        ignoredDirectories: ["static"]
    };
  }
};
