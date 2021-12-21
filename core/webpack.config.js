/* eslint-disable @typescript-eslint/no-var-requires */
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const DefinePlugin = require('webpack').DefinePlugin;
const BannerPlugin = require('webpack').BannerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const AngularCompilerPlugin = require('@artonge/webpack').AngularCompilerPlugin;
const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;

var path = require('path');

var _root = path.resolve(__dirname, '.');

function getRoot(args) {
	args = Array.prototype.slice.call(arguments, 0);
	return path.join.apply(path, [_root].concat(args));
}

const entry = {
	// Keep polyfills at the top so that it's imported first in the HTML
	polyfills: './src/polyfills.ts',
	background: './src/js/modules/background/main.ts',
	collection: './src/js/modules/background/main.ts',
	loading: './src/js/modules/background/main.ts',
	notifications: './src/js/modules/background/main.ts',
	settings: './src/js/modules/background/main.ts',
	battlegrounds: './src/js/modules/background/main.ts',
	overlays: './src/js/modules/background/main.ts',
	overlaysclickthrough: './src/js/modules/background/main.ts',
	mercenariesplayerteam: './src/js/modules/background/main.ts',
	mercenariesopponentteam: './src/js/modules/background/main.ts',
	mercenariesactionqueue: './src/js/modules/background/main.ts',
	mercenariesoutofcombatplayerteam: './src/js/modules/background/main.ts',
	mercenariesoutofcombattreasureselection: './src/js/modules/background/main.ts',
	outofcardscallback: './src/js/modules/background/main.ts',
	'bgsbattlesimulation.worker': './src/js/workers/bgs-simulation.worker.ts',
	'bgspostmatchstats.worker': './src/js/workers/bgs-post-match-stats.worker.ts',
};

module.exports = function (env, argv) {
	const plugins = [
		// Define environment variables to export to Angular
		new DefinePlugin({
			'process.env.APP_VERSION': JSON.stringify(env.appversion),
			'process.env.LOCAL_TEST': env.localTest,
		}),

		new AngularCompilerPlugin({
			tsConfigPath: './tsconfig.json',
			entryModule: './src/js/modules/background/background.module#AppModule',
			sourceMap: true,
		}),

		new BannerPlugin({
			banner: `var window = self;importScripts("./vendor.js");`,
			raw: true,
			entryOnly: true,
			test: /bgsbattlesimulationworker/,
		}),
		new BannerPlugin({
			banner: `var window = self;importScripts("./vendor.js");`,
			raw: true,
			entryOnly: true,
			test: /bgspostmatchstatsworker/,
		}),

		new MiniCssExtractPlugin({
			filename: 'app.css',
		}),

		new CopyWebpackPlugin([
			{ from: path.join(process.cwd(), 'src/assets'), to: 'assets', ignore: ['**/twitch*/*'] },
			// { from: path.join(process.cwd(), 'dependencies/cards.json') },
			{ from: path.join(process.cwd(), 'dependencies/coliseum.js') },
			{ from: path.join(process.cwd(), 'plugins'), to: 'plugins' },
			{ from: path.join(process.cwd(), 'dependencies/achievements'), to: 'achievements' },
			// All the OW stuff, like manifest.json
			{ from: path.join(process.cwd(), 'overwolf/*'), to: '..', flatten: true },
		]),

		// Replace the version in the manifest
		new ReplaceInFileWebpackPlugin([
			{
				dir: 'dist',
				files: ['manifest.json'],
				rules: [
					{
						search: '@app-version@',
						replace: env.appversion,
					},
				],
			},
		]),
		// Automatically update the version in sentry.properties
		new ReplaceInFileWebpackPlugin([
			{
				dir: '.',
				files: ['sentry.properties'],
				rules: [
					{
						search: '@app-version@',
						replace: env.appversion,
					},
				],
			},
		]),

		buildHtmlWebpackPluginConf('background.html', 'background'),
		buildHtmlWebpackPluginConf('collection.html', 'collection'),
		buildHtmlWebpackPluginConf('loading.html', 'loading'),
		buildHtmlWebpackPluginConf('notifications.html', 'notifications'),
		buildHtmlWebpackPluginConf('settings.html', 'settings'),
		buildHtmlWebpackPluginConf('battlegrounds.html', 'battlegrounds'),
		buildHtmlWebpackPluginConf('full_screen_overlays.html', 'overlays'),
		buildHtmlWebpackPluginConf('full_screen_overlays_clickthrough.html', 'overlaysclickthrough'),

		buildHtmlWebpackPluginConf('mercenaries_player_team.html', 'mercenariesplayerteam'),
		buildHtmlWebpackPluginConf('mercenaries_opponent_team.html', 'mercenariesopponentteam'),
		buildHtmlWebpackPluginConf('mercenaries_action_queue.html', 'mercenariesactionqueue'),
		buildHtmlWebpackPluginConf('mercenaries_out_of_combat_player_team.html', 'mercenariesoutofcombatplayerteam'),
		buildHtmlWebpackPluginConf(
			'mercenaries_out_of_combat_treasure_selection.html',
			'mercenariesoutofcombattreasureselection',
		),

		buildHtmlWebpackPluginConf('outofcards-callback.html', 'outofcardscallback'),
		// new BundleAnalyzerPlugin(),
	];

	return {
		mode: env.production ? 'production' : 'development',
		entry: entry,

		// https://hackernoon.com/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
		optimization: env.production
			? {
					runtimeChunk: 'single',
					minimize: true,
					minimizer: [
						new TerserPlugin({
							cache: true,
							parallel: true,
							sourceMap: true, // Must be set to true if using source-maps in production
							terserOptions: {
								mangle: false,
								keep_classnames: true,
								keep_fnames: true,
								compress: {
									pure_funcs: ['console.debug'],
								},
							},
						}),
					],
					namedModules: true,
					namedChunks: true,
					splitChunks: {
						chunks: 'all',
						maxInitialRequests: Infinity,
						minSize: 1 * 1000, // Don't split the really small chunks
						cacheGroups: {
							vendor: {
								test: /node_modules/,
								chunks: 'initial',
								name: 'vendor',
								priority: 10,
								enforce: true,
							},
						},
					},
			  }
			: {
					runtimeChunk: 'single',
					splitChunks: {
						chunks: 'all',
						maxInitialRequests: Infinity,
						minSize: 1 * 1000, // Don't split the really small chunks
						cacheGroups: {
							vendor: {
								test: /node_modules/,
								chunks: 'initial',
								name: 'vendor',
								priority: 10,
								enforce: true,
							},
						},
					},
			  },

		target: 'web',

		devtool: env.production ? false : 'inline-source-map',

		// Doesn't work, for some reason the code loaded after refresh is still the old one
		watch: false,

		watchOptions: {
			ignored: ['node_modules', 'test', 'dependencies'],
		},

		output: {
			path: getRoot('dist/Files'),
			publicPath: './',
			filename: '[name].js',
		},

		resolve: {
			// Having ts before js is important for webpack watch to work
			// However, angular2-indexeddb creates an issue (ts files are packaged alongside js), so
			// you need to remove the .ts files from its node_modules folder
			// See https://github.com/gilf/angular2-indexeddb/issues/67
			extensions: ['.ts', '.js', '.html'],
		},

		module: {
			rules: [
				{
					test: /\.ts$/,
					exclude: [/node_modules/, /test/, /\.worker.ts$/],
					use: ['@ngtools/webpack', 'ts-loader'],
				},
				{
					test: /\.worker.ts$/,
					exclude: [/node_modules/, /test/],
					use: ['ts-loader'],
				},
				{
					test: /\.scss$/,
					exclude: /node_modules/,
					use: ['css-to-string-loader', 'css-loader', 'sass-loader'],
				},
				{
					test: /\.worker\.js$/,
					use: { loader: 'worker-loader' },
				},
			],
		},

		plugins: plugins,
	};
};

const buildHtmlWebpackPluginConf = (filename, chunkName) => {
	// Exclude the other modules. This will still import all the other chunks,
	// thus probably importing some unrelated stuff, but they should be
	// small enough that it should not matter (and we're serving them from
	// the local filesystem, so in the end it doesn't really matter)
	const excludedChunks = Object.keys(entry)
		.filter((chunk) => chunk !== chunkName)
		.filter((chunk) => chunk !== 'polyfills');
	return new HtmlWebpackPlugin({
		filename: filename,
		template: `src/html/${filename}`,
		excludeChunks: excludedChunks,
		chunksSortMode: 'manual',
	});
};
