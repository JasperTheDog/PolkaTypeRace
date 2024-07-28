const path = require("path");

module.exports = {
  // ... your existing configuration ...
  resolve: {
    fallback: {
      fs: false,
      path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify/browser"),
    },
  },
};
