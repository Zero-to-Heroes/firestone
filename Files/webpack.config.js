const webpack = require("@artonge/webpack");
// const ngcWebpack = require("ngc-webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const AngularCompilerPlugin = webpack.AngularCompilerPlugin;

var path = require("path");

var _root = path.resolve(__dirname, ".");

function getRoot(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [_root].concat(args));
}

module.exports = function(env, argv) {
  return {
    mode: env.production ? 'production' : 'development',

    entry: {
      background: "./src/js/modules/background/main.ts",
      collection: "./src/js/modules/collection/main.ts",
      loading: "./src/js/modules/loading/main.ts",
      notifications: "./src/js/modules/notifications/main.ts",
      welcome: "./src/js/modules/welcome/main.ts",
      polyfills: "./src/polyfills.ts"
    },

    target: "web",

    devtool: env.production ? false : "inline-source-map",

    output: {
      path: getRoot("dist"),
      publicPath: "/",
      filename: "[name].js"
    },

    resolve: {
      extensions: [".js", ".ts", ".html"]
    },

    module: {
      rules: [
        {
          test: /.js$/,
          parser: {
            system: true
          }
        },
        // Typescript
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: "@artonge/webpack"
        },
        // Templates
        {
          test: /\.html$/,
          exclude: [
            getRoot("src/html", "background.html"),
            getRoot("src/html", "collection.html"),
          ],
          use: [
            {
              loader: "raw-loader"
            }
          ]
        },
        {
          test: /\.scss$/,
          include: getRoot("src", "css"),
          use: ["raw-loader", "sass-loader"]
        },

        {
          test: /\.scss$/,
          exclude: getRoot("src", "css"),
          use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
        }
      ]
    },
    plugins: [
      // new ngcWebpack.NgcWebpackPlugin({
      //   tsConfigPath: "./tsconfig.json",
      //   mainPath: "./src/js/modules/background/main.ts"
      // }),
      new AngularCompilerPlugin({
        tsConfigPath: "./tsconfig.json",
        entryModules: [
          "./src/js/modules/background/background.module#AppModule",
          "./src/js/modules/collection/collection.module#CollectionModule",
          "./src/js/modules/loading/loading.module#LoadingModule",
          "./src/js/modules/notifications/notifications.module#NotificationsModule",
          "./src/js/modules/welcome/welcome.module#WelcomeModule",
        ],
        sourceMap: true
      }),

      new MiniCssExtractPlugin({
        filename: "app.css"
      }),

      new CopyWebpackPlugin([
        { from: getRoot("src/html", "background.html"), to: getRoot("dist/html", "background.html") },
        { from: getRoot("src/html", "collection.html"), to: getRoot("dist/html", "collection.html") },
        { from: getRoot("src/html", "loading.html"), to: getRoot("dist/html", "loading.html") },
        { from: getRoot("src/html", "notifications.html"), to: getRoot("dist/html", "notifications.html") },
        { from: getRoot("src/html", "welcome.html"), to: getRoot("dist/html", "welcome.html") },
        { from: getRoot("src", "assets"), to: getRoot("dist", "assets") }
      ]),
    ]
  };
};
