/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('@artonge/webpack');
// const ngcWebpack = require("ngc-webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const AngularCompilerPlugin = webpack.AngularCompilerPlugin;
const DefinePlugin = require('webpack').DefinePlugin;
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');

var path = require('path');

var _root = path.resolve(__dirname, '.');

function getRoot(args) {
	args = Array.prototype.slice.call(arguments, 0);
	return path.join.apply(path, [_root].concat(args));
}

module.exports = function(env, argv) {
	const plugins = [
		// Define environment variables to export to Angular
		new DefinePlugin({
			'process.env.APP_VERSION': JSON.stringify(env.appversion),
			'process.env.LOCAL_TEST': env.localTest,
		}),

		new AngularCompilerPlugin({
			tsConfigPath: './tsconfig.json',
			entryModules: [
				'./src/js/modules/background/background.module#AppModule',
				'./src/js/modules/collection/collection.module#CollectionModule',
				'./src/js/modules/loading/loading.module#LoadingModule',
				'./src/js/modules/notifications/notifications.module#NotificationsModule',
				'./src/js/modules/decktracker/decktracker.module#DeckTrackerModule',
				'./src/js/modules/decktracker-opponent/decktracker-opponent.module#DeckTrackerOpponentModule',
				'./src/js/modules/secrets-helper/secrets-helper.module#SecretsHelperModule',
				'./src/js/modules/secrets-helper-widget/secrets-helper-widget.module#SecretsHelperWidgetModule',
				'./src/js/modules/opponent-hand/opponent-hand-overlay.module#OpponentHandOverlayModule',
				'./src/js/modules/settings/settings.module#SettingsModule',
				'./src/js/modules/twitch-auth-callback/twitch-auth-callback.module#TwitchAuthCallbackModule',
				'./src/js/modules/battlegrounds-player-summary/battlegrounds-player-summary.module#BattlegroundsPlayerSummaryModule',
				'./src/js/modules/battlegrounds-leaderboard-overlay/battlegrounds-leaderboard-overlay.module#BattlegroundsLeaderboardOverlayModule',
				'./src/js/modules/battlegrounds-hero-selection-overlay/battlegrounds-hero-selection-overlay.module#BattlegroundsHeroSelectionOverlayModule',
			],
			sourceMap: true,
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

		new HtmlWebpackPlugin({
			filename: 'background.html',
			template: 'src/html/background.html',
			// Exclude the other modules. This will still import all the other chunks,
			// thus probably importing some unrelated stuff, but they should be
			// small enough that it should not matter (and we're serving them from
			// the local filesystem, so in the end it doesn't really matter)
			excludeChunks: [
				'collection',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'loading',
				'notifications',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'collection.html',
			template: 'src/html/collection.html',
			excludeChunks: [
				'background',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'loading',
				'notifications',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'loading.html',
			template: 'src/html/loading.html',
			excludeChunks: [
				'collection',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'background',
				'notifications',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'notifications.html',
			template: 'src/html/notifications.html',
			excludeChunks: [
				'collection',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'background',
				'loading',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'decktracker.html',
			template: 'src/html/decktracker.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'loading',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'decktracker_opponent.html',
			template: 'src/html/decktracker_opponent.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'secretshelper',
				'secretshelperwidget',
				'loading',
				'decktracker',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'secrets_helper.html',
			template: 'src/html/secrets_helper.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'decktrackeropponent',
				'secretshelperwidget',
				'loading',
				'decktracker',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'secrets_helper_widget.html',
			template: 'src/html/secrets_helper_widget.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'decktrackeropponent',
				'secretshelper',
				'loading',
				'decktracker',
				'settings',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'settings.html',
			template: 'src/html/settings.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'loading',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'twitchauthcallback',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'twitch-auth-callback.html',
			template: 'src/html/twitch-auth-callback.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'loading',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'settings',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'match_overlay_opponent_hand.html',
			template: 'src/html/match_overlay_opponent_hand.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'loading',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'settings',
				'twitchauthcallback',
				'matchStats',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'battlegrounds_player_info.html',
			template: 'src/html/battlegrounds_player_info.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'loading',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'settings',
				'twitchauthcallback',
				'matchStats',
				'opponentHand',
				'battlegroundsleaderboardoverlay',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'battlegrounds_leaderboard_overlay.html',
			template: 'src/html/battlegrounds_leaderboard_overlay.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'loading',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'settings',
				'twitchauthcallback',
				'matchStats',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsheroselectionoverlay',
			],
			chunksSortMode: 'manual',
		}),
		new HtmlWebpackPlugin({
			filename: 'battlegrounds_hero_selection_overlay.html',
			template: 'src/html/battlegrounds_hero_selection_overlay.html',
			excludeChunks: [
				'collection',
				'notifications',
				'background',
				'loading',
				'decktracker',
				'decktrackeropponent',
				'secretshelper',
				'secretshelperwidget',
				'settings',
				'twitchauthcallback',
				'matchStats',
				'opponentHand',
				'battlegroundsplayersummary',
				'battlegroundsleaderboardoverlay',
			],
			chunksSortMode: 'manual',
		}),

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
		// new BundleAnalyzerPlugin(),
	];

	// if (env.production) {
	// 	plugins.push(
	// 		new SentryWebpackPlugin({
	// 			include: '.',
	// 			ignoreFile: '.sentrycliignore',
	// 			ignore: ['node_modules', 'test', 'dependencies', 'webpack.config.js', 'webpack-twitch.config.js'],
	// 			configFile: 'sentry.properties',
	// 		}),
	// 	);
	// }

	return {
		mode: env.production ? 'production' : 'development',

		entry: {
			// Keep polyfills at the top so that it's imported first in the HTML
			polyfills: './src/polyfills.ts',
			background: './src/js/modules/background/main.ts',
			collection: './src/js/modules/collection/main.ts',
			loading: './src/js/modules/loading/main.ts',
			notifications: './src/js/modules/notifications/main.ts',
			decktracker: './src/js/modules/decktracker/main.ts',
			decktrackeropponent: './src/js/modules/decktracker-opponent/main.ts',
			secretshelper: './src/js/modules/secrets-helper/main.ts',
			secretshelperwidget: './src/js/modules/secrets-helper-widget/main.ts',
			opponentHand: './src/js/modules/opponent-hand/main.ts',
			settings: './src/js/modules/settings/main.ts',
			twitchauthcallback: './src/js/modules/twitch-auth-callback/main.ts',
			battlegroundsplayersummary: './src/js/modules/battlegrounds-player-summary/main.ts',
			battlegroundsleaderboardoverlay: './src/js/modules/battlegrounds-leaderboard-overlay/main.ts',
			battlegroundsheroselectionoverlay: './src/js/modules/battlegrounds-hero-selection-overlay/main.ts',
		},

		// https://hackernoon.com/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
		optimization: {
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
					exclude: [/node_modules/, /test/],
					use: ['@artonge/webpack'],
				},
				{
					test: /\.scss$/,
					exclude: /node_modules/,
					use: ['css-to-string-loader', 'css-loader', 'sass-loader'],
				},
			],
		},

		plugins: plugins,
	};
};
