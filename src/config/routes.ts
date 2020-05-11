export const DEFAULT = {
  routes: function (api) {
    return {
      get: [
        { path: '/', action: 'shopify:authCheck' },
        { path: '/static/test', action: 'shopify:authCheck' },
        { path: '/auth', action: 'shopify:auth'},
        { path: '/auth/inline', action: 'shopify:authInline'},
        { path: '/auth/callback', action: 'shopify:authCallback'}
      ]
    }
  }
}
