module.exports = {
  mode: 'production',
  devtool: 'eval',
  entry: {
    bundle: "./src/cursor.js",
  },
  output: {
    filename: "spec.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
          }
        ]
      }
    ],
  },
  output: {filename: 'spec.js' },
  watch: false
};
