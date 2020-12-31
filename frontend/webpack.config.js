const webpack = require('webpack');

module.exports = {
  plugins: [
    // Ignore all locale files of moment.js except Czech and Slovak
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /cs/),
  ],
};

