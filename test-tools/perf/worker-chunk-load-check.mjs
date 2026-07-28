/**
 * Loads a built web-worker chunk in a Node vm context that mimics a worker's
 * global scope WITHOUT Node globals (no `process`, no `global`), to catch
 * module-init crashes like "process is not defined" (the polyfills.ts shims only
 * run in the renderer, not in worker bundles).
 *
 * The webpack worker runtime pulls its dependency chunks synchronously through
 * importScripts and starts up inside a Promise, so load failures surface as
 * "Uncaught (in promise)" — we implement importScripts against the dist folder
 * and fail on any unhandled rejection.
 *
 * Usage: node test-tools/perf/worker-chunk-load-check.mjs <path-to-chunk.js>
 */
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

const chunkPath = process.argv[2];
if (!chunkPath || !fs.existsSync(chunkPath)) {
	console.error('usage: node worker-chunk-load-check.mjs <path-to-chunk.js>; not found:', chunkPath);
	process.exit(2);
}
const distDir = path.dirname(chunkPath);

const fail = (...args) => {
	console.error('FAIL:', ...args);
	process.exit(1);
};
process.on('unhandledRejection', (e) => fail('async crash at load:', e?.message ?? e));

const listeners = [];
const sandbox = {
	console,
	setTimeout,
	clearTimeout,
	setInterval,
	clearInterval,
	TextDecoder,
	TextEncoder,
	URL,
	importScripts: (url) => {
		const file = path.join(distDir, path.basename(String(url)));
		vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
	},
	addEventListener: (type, cb) => listeners.push({ type, cb }),
	removeEventListener: () => void 0,
	postMessage: () => void 0,
	navigator: { userAgent: 'worker-chunk-load-check' },
	location: { href: 'http://localhost/worker.js' },
};
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

try {
	vm.runInContext(fs.readFileSync(chunkPath, 'utf8'), sandbox, { filename: chunkPath });
} catch (e) {
	fail('chunk crashed at load:', e?.message);
}

// Startup is async; give the microtask queue a beat before checking
setTimeout(() => {
	if (!listeners.some((l) => l.type === 'message')) {
		fail('no message listener registered');
	}
	console.log('OK: chunk loaded;', listeners.length, 'message listener(s) registered');
	process.exit(0);
}, 500);
