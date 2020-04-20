const webpack = require("webpack");
const FilterWarningsPlugin = require("webpack-filter-warnings-plugin");

module.exports = {
  webpack: {
    node: undefined,
    configure: {
      target: "electron-renderer",
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.FLUENTFFMPEG_COV": false,
      }),
      new FilterWarningsPlugin({
        exclude: /Critical dependency/,
      }),
    ],
  },
};
