export const DEFAULT = {
  routes: function (api) {
    return {
      get: [
        { path: '/', action: 'shopify:authCheck' },
        { path: '/static/test', action: 'shopify:authCheck' },
      ]
    }
  }
}
