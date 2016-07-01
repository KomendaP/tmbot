var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    if (!mod.match(/babel(.*)?/)) {
      nodeModules[mod] = 'commonjs ' + mod;
    }
  });

module.exports = {
  context: path.resolve(__dirname, 'src'),
  
  entry: {
    bundle: './main.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'prod'),
    filename: '[name].js'
  },
  externals: nodeModules,
  devtool: 'source-map',
  
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel"
      },
      {
        test: /\.json$/,
        // exclude: /(node_modules|bower_components)/,
        loader: 'json'
      }
    ]
  },
  
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      NODE_ENV: JSON.stringify('xoxb-56065086148-skcrIBftk6SWXbD2UvTidLpr')
    })
  ]
};