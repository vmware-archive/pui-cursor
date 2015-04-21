module.exports = {
  devtool: 'eval',
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  },
  output: {filename: 'spec.js' },
  quiet: true,
  watch: true
};
