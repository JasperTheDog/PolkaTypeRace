const path = require("path");
// webpack.config.js
const webpack = require('webpack');

module.exports = {
  // ... your existing configuration ...
  resolve: {
    fallback: {
      fs: false,
      path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify/browser"),
      buffer: require.resolve('buffer/'),

    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
