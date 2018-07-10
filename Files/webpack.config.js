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

    optimization: {
      splitChunks: {
        cacheGroups: {
          // commons: {
          //   chunks: "initial",
          //   minChunks: 2,
          //   maxInitialRequests: 5, // The default limit is too small to showcase the effect
          //   minSize: 0 // This is example is too small to create commons chunks
          // },
          vendor: {
            test: /node_modules/,
            chunks: "initial",
            name: "vendor",
            priority: 10,
            enforce: true
          }
        }
      }
    },

    target: "web",

    devtool: env.production ? false : "inline-source-map",

    watch: true,

    watchOptions: {
      // poll: true,
      ignored: ['node_modules']
    },

    output: {
      path: getRoot("dist/Files"),
      publicPath: "/",
      filename: "[name].js"
    },

    resolve: {
      // Having ts before js is important for webpack watch to work
      // However, angular2-indexeddb creates an issue (ts files are packaged alongside js), so
      // you need to remove the .ts files from its node_modules folder
      // See https://github.com/gilf/angular2-indexeddb/issues/67
      extensions: [".ts", ".js", ".html"]
    },

    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: "@artonge/webpack"
        },
        {
          test: /.js$/,
          parser: {
            system: true
          }
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
        { from: path.join(process.cwd(), "src/html/background.html"), to: "html" },
        { from: path.join(process.cwd(), "src/html/collection.html"), to: "html" },
        { from: path.join(process.cwd(), "src/html/loading.html"), to: "html" },
        { from: path.join(process.cwd(), "src/html/notifications.html"), to: "html" },
        { from: path.join(process.cwd(), "src/html/welcome.html"), to: "html" },
        { from: path.join(process.cwd(), "/../*") },
        { from: path.join(process.cwd(), "src/assets"), to: "assets" },
        { from: path.join(process.cwd(), "dependencies"), to: "dependencies" },
        { from: path.join(process.cwd(), "plugins"), to: "plugins" },
      ]),
    ]
  };
};
