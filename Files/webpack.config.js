const fs = require('fs');
const path = require('path');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');
const cssnano = require('cssnano');
const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;

const { NoEmitOnErrorsPlugin, SourceMapDevToolPlugin, NamedModulesPlugin } = require('webpack');
// const { GlobCopyWebpackPlugin } = require('@angular/cli/plugins/webpack');
// const { CommonsChunkPlugin } = require('webpack').optimize;
// const { AotPlugin } = require('@ngtools/webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const nodeModules = path.join(process.cwd(), 'node_modules');
const realNodeModules = fs.realpathSync(nodeModules);
const genDirNodeModules = path.join(process.cwd(), 'src', '$$_gendir', 'node_modules');
const entryPoints = ["polyfills","vendor","background","notifications","welcome","loading","collection"];
const minimizeCss = false;
const baseHref = "";
const deployUrl = "";
// const postcssPlugins = function () {
// 				// safe settings based on: https://github.com/ben-eb/cssnano/issues/358#issuecomment-283696193
// 				const importantCommentRe = /@preserve|@license|[@#]\s*source(?:Mapping)?URL|^!/i;
// 				const minimizeOptions = {
// 						autoprefixer: false,
// 						safe: true,
// 						mergeLonghand: false,
// 						discardComments: { remove: (comment) => !importantCommentRe.test(comment) }
// 				};
// 				return [
// 						postcssUrl({
// 								url: (URL) => {
// 										// Only convert root relative URLs, which CSS-Loader won't process into require().
// 										if (!URL || !URL.startsWith('/') || URL.startsWith('//')) {
// 												return URL;
// 										}
// 										if (deployUrl.match(/:\/\//)) {
// 												// If deployUrl contains a scheme, ignore baseHref use deployUrl as is.
// 												return `${deployUrl.replace(/\/$/, '')}${URL}`;
// 										}
// 										else if (baseHref.match(/:\/\//)) {
// 												// If baseHref contains a scheme, include it as is.
// 												return baseHref.replace(/\/$/, '') +
// 														`/${deployUrl}/${URL}`.replace(/\/\/+/g, '/');
// 										}
// 										else {
// 												// Join together base-href, deploy-url and the original URL.
// 												// Also dedupe multiple slashes into single ones.
// 												return `/${baseHref}/${deployUrl}/${URL}`.replace(/\/\/+/g, '/');
// 										}
// 								}
// 						}),
// 						autoprefixer(),
// 				].concat(minimizeCss ? [cssnano(minimizeOptions)] : []);
// 		};




module.exports = {
	mode: 'production',
	entry: {
		"background": "./src/js/modules/background/main.ts",
		"notifications": "./src/js/modules/notifications/main.ts",
		"welcome": "./src/js/modules/welcome/main.ts",
		"loading": "./src/js/modules/loading/main.ts",
		"collection": "./src/js/modules/collection/main.ts",
		"polyfills": "./src/polyfills.ts"
	},
	output: {
		"path": path.join(process.cwd(), "dist/Files"),
		"filename": "[name].bundle.js",
		"chunkFilename": "[id].chunk.js"
	},
	// optimization: {
 //        splitChunks: {
 //            chunks: 'all'
 //        }
 //    },
	"module": {
		"rules": [
			{
				"test": /\.js$/,
				"enforce": "pre",
				"loader": "source-map-loader",
				"exclude": [
					/(\\|\/)node_modules(\\|\/)/
				]
			},
			{
				"test": /\.html$/,
				"loader": "raw-loader"
			},
			{
				"test": /\.(eot|svg|cur)$/,
				"loader": "file-loader?name=[name].[hash:20].[ext]"
			},
			{
				"test": /\.(jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
				"loader": "url-loader?name=[name].[hash:20].[ext]&limit=10000"
			},
			// {
			// 	"exclude": [],
			// 	"test": /\.css$/,
			// 	"use": [
			// 		"exports-loader?module.exports.toString()",
			// 		{
			// 			"loader": "css-loader",
			// 			"options": {
			// 				"sourceMap": false,
			// 				"importLoaders": 1
			// 			}
			// 		},
			// 		{
			// 			"loader": "postcss-loader",
			// 			"options": {
			// 				"ident": "postcss",
			// 				"plugins": postcssPlugins
			// 			}
			// 		}
			// 	]
			// },
			{
				"exclude": [],
				"test": /\.scss$$/,
				"use": [
					"exports-loader?module.exports.toString()",
					{
						"loader": "css-loader",
						"options": {
							"sourceMap": false,
							"importLoaders": 1
						}
					},
					{
						"loader": "postcss-loader",
						"options": {
							"ident": "postcss",
							// "plugins": postcssPlugins
						}
					},
					{
						"loader": "sass-loader",
						"options": {
							"sourceMap": false,
							"precision": 8,
							"includePaths": []
						}
					}
				]
			},
			{
				"test": /\.ts$/,
				"loader": "@ngtools/webpack",
				"options": {
					"tsConfigPath": "src\\tsconfig.app.json",
				}
			}
		]
	},
	"resolve": {
		"extensions": [
			".ts",
			".js"
		],
		"modules": [
			"./node_modules"
		],
		"symlinks": true
	},
	"resolveLoader": {
		"modules": [
			"./node_modules"
		]
	},
	"plugins": [
	 	new AngularCompilerPlugin({
      		tsConfigPath: './tsconfig.json',
      		sourceMap: true
    	}),
		new CleanWebpackPlugin(['dist'], {verbose:  true}),
		new NoEmitOnErrorsPlugin(),
		new CopyWebpackPlugin([
			{ from: path.join(process.cwd(), "src/assets"), to: "assets" },
			{ from: process.cwd() + '/src/favicon.ico', to: process.cwd() + "/dist" },
			{ from: path.join(process.cwd(), "/../*") },
			{ from: path.join(process.cwd(), "dependencies"), to: "dependencies" },
			{ from: path.join(process.cwd(), "plugins"), to: "plugins" }
		]),
		new ProgressPlugin(),
		new CircularDependencyPlugin({
			"exclude": /(\\|\/)node_modules(\\|\/)/,
			"failOnError": false
		}),
		new HtmlWebpackPlugin({
			"template": "./src\\html\\background.html",
			"filename": "./html\\background.html",
			"hash": false,
			"inject": true,
			"compile": true,
			"favicon": false,
			"minify": false,
			"cache": true,
			"showErrors": true,
			"chunks": "all",
			"excludeChunks": ["notifications","welcome","loading","collection"],
			"title": "Firestone",
			"xhtml": true,
			"chunksSortMode": function sort(left, right) {
				let leftIndex = entryPoints.indexOf(left.names[0]);
				let rightindex = entryPoints.indexOf(right.names[0]);
				if (leftIndex > rightindex) {
						return 1;
				}
				else if (leftIndex < rightindex) {
						return -1;
				}
				else {
						return 0;
				}
		}
		}),
		new HtmlWebpackPlugin({
			"template": "./src\\html\\notifications.html",
			"filename": "./html\\notifications.html",
			"hash": false,
			"inject": true,
			"compile": true,
			"favicon": false,
			"minify": false,
			"cache": true,
			"showErrors": true,
			"chunks": "all",
			"excludeChunks": ["background","welcome","loading","collection"],
			"title": "Firestone",
			"xhtml": true,
			"chunksSortMode": function sort(left, right) {
				let leftIndex = entryPoints.indexOf(left.names[0]);
				let rightindex = entryPoints.indexOf(right.names[0]);
				if (leftIndex > rightindex) {
						return 1;
				}
				else if (leftIndex < rightindex) {
						return -1;
				}
				else {
						return 0;
				}
		}
		}),
		new HtmlWebpackPlugin({
			"template": "./src\\html\\loading.html",
			"filename": "./html\\loading.html",
			"hash": false,
			"inject": true,
			"compile": true,
			"favicon": false,
			"minify": false,
			"cache": true,
			"showErrors": true,
			"chunks": "all",
			"excludeChunks": ["background","notifications","welcome","collection"],
			"title": "Firestone",
			"xhtml": true,
			"chunksSortMode": function sort(left, right) {
				let leftIndex = entryPoints.indexOf(left.names[0]);
				let rightindex = entryPoints.indexOf(right.names[0]);
				if (leftIndex > rightindex) {
						return 1;
				}
				else if (leftIndex < rightindex) {
						return -1;
				}
				else {
						return 0;
				}
		}
		}),
		new HtmlWebpackPlugin({
			"template": "./src\\html\\welcome.html",
			"filename": "./html\\welcome.html",
			"hash": false,
			"inject": true,
			"compile": true,
			"favicon": false,
			"minify": false,
			"cache": true,
			"showErrors": true,
			"chunks": "all",
			"excludeChunks": ["background","notifications","loading","collection"],
			"title": "Firestone",
			"xhtml": true,
			"chunksSortMode": function sort(left, right) {
				let leftIndex = entryPoints.indexOf(left.names[0]);
				let rightindex = entryPoints.indexOf(right.names[0]);
				if (leftIndex > rightindex) {
						return 1;
				}
				else if (leftIndex < rightindex) {
						return -1;
				}
				else {
						return 0;
				}
		}
		}),
		new HtmlWebpackPlugin({
			"template": "./src\\html\\collection.html",
			"filename": "./html\\collection.html",
			"hash": false,
			"inject": true,
			"compile": true,
			"favicon": false,
			"minify": false,
			"cache": true,
			"showErrors": true,
			"chunks": "all",
			"excludeChunks": ["background","notifications","welcome","loading"],
			"title": "Firestone",
			"xhtml": true,
			"chunksSortMode": function sort(left, right) {
				let leftIndex = entryPoints.indexOf(left.names[0]);
				let rightindex = entryPoints.indexOf(right.names[0]);
				if (leftIndex > rightindex) {
						return 1;
				}
				else if (leftIndex < rightindex) {
						return -1;
				}
				else {
						return 0;
				}
		}
		}),
		// new BaseHrefWebpackPlugin({}),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"inline"
		// 	],
		// 	"minChunks": null
		// }),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"vendor"
		// 	],
		// 	"minChunks": (module) => {
		// 						return module.resource
		// 								&& (module.resource.startsWith(nodeModules)
		// 										|| module.resource.startsWith(genDirNodeModules)
		// 										|| module.resource.startsWith(realNodeModules));
		// 				},
		// 	"chunks": [
		// 		"background", "notifications", "welcome", "loading", "collection", "errors"
		// 	]
		// }),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"background"
		// 	],
		// 	"minChunks": 2,
		// 	"async": "common"
		// }),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"notifications"
		// 	],
		// 	"minChunks": 2,
		// 	"async": "common"
		// }),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"welcome"
		// 	],
		// 	"minChunks": 2,
		// 	"async": "common"
		// }),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"loading"
		// 	],
		// 	"minChunks": 2,
		// 	"async": "common"
		// }),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"collection"
		// 	],
		// 	"minChunks": 2,
		// 	"async": "common"
		// }),
		// new CommonsChunkPlugin({
		// 	"name": [
		// 		"errors"
		// 	],
		// 	"minChunks": 2,
		// 	"async": "common"
		// }),
		new NamedModulesPlugin({}),
		// new AotPlugin({
		// 	"mainPath": "js\\modules\\background\\main.ts",
		// 	"replaceExport": false,
		// 	"hostReplacementPaths": {
		// 		"environments\\environment.ts": "environments\\environment.ts"
		// 	},
		// 	"exclude": [],
		// 	"tsConfigPath": "src\\tsconfig.app.json",
		// 	"skipCodeGeneration": true
		// })
	],
	"node": {
		"fs": "empty",
		"global": true,
		"crypto": "empty",
		"tls": "empty",
		"net": "empty",
		"process": true,
		"module": false,
		"clearImmediate": false,
		"setImmediate": false
	},
	"devServer": {
		"historyApiFallback": true
	}
};
