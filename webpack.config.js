const path = require("path");
const glob = require("glob");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

// One entry per src/<template>/index.tsx -> build/<template>.js (global PRSSComponent)
const entry = glob.sync("src/*/index.+(js|jsx|ts|tsx)").reduce((acc, file) => {
  const norm = file.split(path.sep).join("/");
  const parts = norm.split("/");
  const key = parts[parts.indexOf("src") + 1];
  acc[key] = "./" + norm;
  return acc;
}, {});

module.exports = {
  mode: "production",
  entry,
  devtool: "source-map",
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
    libraryTarget: "var",
    library: "PRSSComponent",
    clean: true
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()]
  },
  module: {
    rules: [
      {
        test: /\.m?js(x?)|ts(x?)$/,
        exclude: /(node_modules|bower_components)/,
        use: { loader: "babel-loader" }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: { "@": path.resolve(__dirname, "src/_common") }
  },
  performance: { hints: false },
  externals: {
    prss: "PRSS",
    "@prss/ui": "PRSS",
    react: "React",
    "react-dom": "ReactDOM",
    "react-dom/client": "ReactDOM"
  },
  plugins: [new MiniCssExtractPlugin({ filename: "theme.css" })]
};
