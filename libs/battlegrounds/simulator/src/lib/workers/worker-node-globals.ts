/**
 * Node-global shims for web worker bundles. MUST be the first import of the worker
 * entry file, so it executes before any dependency's module-init code.
 *
 * Why: the renderer gets `window.process` from apps/legacy/src/polyfills.ts, but web
 * workers have their own webpack entry that never runs the app polyfills. The upload
 * prep ops (Plan H port) pull @firestone-hs/hs-replay-xml-parser -> elementtree ->
 * require('util'), and the bundled npm `util` shim reads `process.env.NODE_DEBUG` at
 * module init — crashing the whole worker bundle with "process is not defined"
 * before it can handle a single message.
 */
const g = globalThis as any;
g.global = g.global ?? g;
g.process = g.process ?? {
	env: { DEBUG: undefined },
	version: 'v22.0.0',
	// readable-stream (via jszip) calls this if its stream paths are ever exercised
	nextTick: (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(() => fn(...args), 0),
};

export {};
