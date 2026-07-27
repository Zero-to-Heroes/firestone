const path = require('path');
const esbuild = require('esbuild');

const entry = path.join(__dirname, 'src/app/services/compute-worker.thread.ts');
const outfile = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app', 'compute-worker.thread.js');

/**
 * The Electron main process is webpack-bundled, but this worker is a separate Node
 * worker_threads entry. Plain `tsc` leaves require('@firestone-hs/...') intact, and
 * those packages are not present in the packaged app's node_modules (only native
 * externals like better-sqlite3 are). Bundle deps into the worker so it runs in asar.
 */
esbuild
	.build({
		entryPoints: [entry],
		bundle: true,
		platform: 'node',
		format: 'cjs',
		target: 'es2020',
		outfile,
		external: ['worker_threads'],
		logLevel: 'info',
	})
	.then(() => {
		console.log('Bundled compute worker to:', outfile);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
