const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const FilterWarningsPlugin = require("webpack-filter-warnings-plugin");

module.exports = {
  webpack: {
    node: undefined,
    configure: {
      target: "electron-renderer",
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [{ from: "node_modules/libass-wasm/dist" }],
      }),
      new webpack.DefinePlugin({
        "process.env.FLUENTFFMPEG_COV": false,
      }),
      new FilterWarningsPlugin({
        exclude: /Critical dependency/,
      }),
    ],
  },
};
