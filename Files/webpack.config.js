const webpack = require("@artonge/webpack");
// const ngcWebpack = require("ngc-webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const AngularCompilerPlugin = webpack.AngularCompilerPlugin;
const DefinePlugin = require("webpack").DefinePlugin;
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

var path = require("path");

var _root = path.resolve(__dirname, ".");

function getRoot(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [_root].concat(args));
}

module.exports = function(env, argv) {

    const plugins = [
        // Define environment variables to export to Angular
        new DefinePlugin({
            'process.env.APP_VERSION': JSON.stringify(env.appversion),
        }),
        
        new AngularCompilerPlugin({
            tsConfigPath: "./tsconfig.json",
            entryModules: [
                "./src/js/modules/background/background.module#AppModule",
                "./src/js/modules/collection/collection.module#CollectionModule",
                "./src/js/modules/loading/loading.module#LoadingModule",
                "./src/js/modules/notifications/notifications.module#NotificationsModule",
                "./src/js/modules/decktracker/decktracker.module#DeckTrackerModule",
                "./src/js/modules/settings/settings.module#SettingsModule",
                "./src/js/modules/welcome/welcome.module#WelcomeModule",
                "./src/js/modules/twitch-auth-callback/twitch-auth-callback.module#TwitchAuthCallbackModule",
            ],
            sourceMap: true
        }),
        
        new MiniCssExtractPlugin({
            filename: "app.css"
        }),
        
        new CopyWebpackPlugin([
            { from: path.join(process.cwd(), "src/html/background.html")},
            { from: path.join(process.cwd(), "src/html/collection.html")},
            { from: path.join(process.cwd(), "src/html/loading.html")},
            { from: path.join(process.cwd(), "src/html/notifications.html")},
            { from: path.join(process.cwd(), "src/html/decktracker.html")},
            { from: path.join(process.cwd(), "src/html/settings.html")},
            { from: path.join(process.cwd(), "src/html/welcome.html")},
            { from: path.join(process.cwd(), "src/html/twitch-auth-callback.html")},
            { from: path.join(process.cwd(), "/../*") },
            { from: path.join(process.cwd(), "src/assets"), to: "assets" },
            { from: path.join(process.cwd(), "dependencies"), to: "dependencies" },
            { from: path.join(process.cwd(), "plugins"), to: "plugins" },
        ]),
        
        // Replace the version in the manifest
        new ReplaceInFileWebpackPlugin([{
            dir: 'dist',
            files: ['manifest.json'],
            rules: [{
                search: '@app-version@',
                replace: env.appversion
            }]
        }]),
        // Automatically update the version in sentry.properties
        new ReplaceInFileWebpackPlugin([{
            dir: '.',
            files: ['sentry.properties'],
            rules: [{
                search: '@app-version@',
                replace: env.appversion
            }]
        }]),
    ];

    if (env.production) {
        plugins.push(
            new SentryWebpackPlugin({
                include: '.',
                ignoreFile: '.sentrycliignore',
                ignore: ['node_modules', 'webpack.config.js', 'webpack-twitch.config.js'],
                configFile: 'sentry.properties'
            })
        );
    }
    
    return {
        mode: env.production ? 'production' : 'development',
        
        entry: {
            background: "./src/js/modules/background/main.ts",
            collection: "./src/js/modules/collection/main.ts",
            loading: "./src/js/modules/loading/main.ts",
            notifications: "./src/js/modules/notifications/main.ts",
            decktracker: "./src/js/modules/decktracker/main.ts",
            settings: "./src/js/modules/settings/main.ts",
            welcome: "./src/js/modules/welcome/main.ts",
            twitchauthcallback: "./src/js/modules/twitch-auth-callback/main.ts",
            polyfills: "./src/polyfills.ts"
        },
        
        optimization: {
            splitChunks: {
                cacheGroups: {
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
        
        plugins: plugins,
    };
};
