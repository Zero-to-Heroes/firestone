const path = require('path');
const esbuild = require('esbuild');

const outdir = path.join(__dirname, '..', '..', 'dist', 'apps', 'electron-app');

/**
 * The Electron main process is webpack-bundled, but these workers are separate Node
 * worker_threads entries. Plain `tsc` leaves require('@firestone-hs/...') intact, and
 * those packages are not present in the packaged app's node_modules (only native
 * externals like better-sqlite3 are). Bundle deps into the workers so they run in asar.
 */
const entries = ['src/app/services/bgs-battle-sim-worker.thread.ts', 'src/app/services/upload-prep-worker.thread.ts'];

esbuild
	.build({
		entryPoints: entries.map((entry) => path.join(__dirname, entry)),
		bundle: true,
		platform: 'node',
		format: 'cjs',
		target: 'es2020',
		outdir,
		external: ['worker_threads'],
		logLevel: 'info',
	})
	.then(() => {
		console.log('Bundled worker threads to:', outdir);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
