/**
 * Live-app benchmark over the Chrome DevTools Protocol.
 *
 * Attaches to the running Overwolf Firestone app (remote debugging port 54284 by default),
 * runs `window.fakeGame(<log>, { isBg: true })` in the Background window, and captures CPU
 * profiles of BOTH the Background window (services pipeline) and the Overlays window
 * (overlay rendering / change detection) for the duration of the run.
 *
 * Usage:
 *   node test-tools/perf/live-bench.mjs [logFileName] [port]
 *
 * Outputs:
 *   test-tools/perf/live-background.cpuprofile
 *   test-tools/perf/live-overlays.cpuprofile
 *   (analyze with test-tools/perf/analyze-cpuprofile.mjs)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = process.argv[2] ?? 'bg.log';
const PORT = Number(process.argv[3] ?? 54284);

class Cdp {
	constructor(ws, label) {
		this.ws = ws;
		this.label = label;
		this.nextId = 1;
		this.pending = new Map();
		ws.addEventListener('message', (event) => {
			const msg = JSON.parse(event.data);
			if (msg.id && this.pending.has(msg.id)) {
				const { resolve, reject } = this.pending.get(msg.id);
				this.pending.delete(msg.id);
				if (msg.error) {
					reject(new Error(`[${this.label}] ${msg.error.message}`));
				} else {
					resolve(msg.result);
				}
			}
		});
	}

	send(method, params = {}) {
		const id = this.nextId++;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.ws.send(JSON.stringify({ id, method, params }));
		});
	}

	static async connect(url, label) {
		const ws = new WebSocket(url);
		await new Promise((resolve, reject) => {
			ws.addEventListener('open', resolve, { once: true });
			ws.addEventListener('error', () => reject(new Error(`WS connect failed: ${url}`)), { once: true });
		});
		return new Cdp(ws, label);
	}

	close() {
		this.ws.close();
	}
}

async function evalIn(cdp, expression, { awaitPromise = false } = {}) {
	const result = await cdp.send('Runtime.evaluate', {
		expression,
		returnByValue: true,
		awaitPromise,
	});
	if (result.exceptionDetails) {
		throw new Error(`[${cdp.label}] eval failed: ${JSON.stringify(result.exceptionDetails).slice(0, 500)}`);
	}
	return result.result?.value;
}

async function main() {
	const listResp = await fetch(`http://127.0.0.1:${PORT}/json/list`);
	const targets = await listResp.json();
	const background = targets.find((t) => t.title === 'Firestone - Background');
	const overlays = targets.find((t) => t.title === 'Firestone - Overlays');
	if (!background) {
		console.error('Firestone - Background window not found. Targets:');
		targets.forEach((t) => console.error(` - ${t.title}`));
		process.exit(1);
	}

	console.log('Attaching to Background window...');
	const bg = await Cdp.connect(background.webSocketDebuggerUrl, 'background');
	const ov = overlays ? await Cdp.connect(overlays.webSocketDebuggerUrl, 'overlays') : null;
	if (!ov) {
		console.warn('Overlays window not found - profiling background only.');
	}

	await bg.send('Runtime.enable');

	// Sanity: is this the new build with the dev perf commands?
	const commands = await evalIn(
		bg,
		`JSON.stringify({ fakeGame: typeof window.fakeGame, gsPerfEnable: typeof window.gsPerfEnable })`,
	);
	console.log('dev commands:', commands);
	if (!commands.includes('"fakeGame":"function"')) {
		console.error('fakeGame is not registered in this window - is this a dev build?');
		process.exit(1);
	}
	const hasPerfCommands = commands.includes('"gsPerfEnable":"function"');
	if (!hasPerfCommands) {
		console.warn('gsPerfEnable missing - running build predates the perf commands; skipping bucket stats.');
	} else {
		await evalIn(bg, `window.gsPerfEnable(true); window.gsPerfReset();`);
	}

	// Start CPU profiling on both windows.
	for (const cdp of [bg, ov].filter(Boolean)) {
		await cdp.send('Profiler.enable');
		await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
		await cdp.send('Profiler.start');
	}

	console.log(`Running fakeGame('${LOG_FILE}', { isBg: true })... (this can take a few minutes)`);
	const runStart = Date.now();
	const timings = await evalIn(bg, `window.fakeGame(${JSON.stringify(LOG_FILE)}, { isBg: true })`, {
		awaitPromise: true,
	});
	const runElapsed = Date.now() - runStart;

	const profiles = {};
	for (const [name, cdp] of [
		['background', bg],
		['overlays', ov],
	]) {
		if (!cdp) continue;
		const { profile } = await cdp.send('Profiler.stop');
		const outPath = path.join(__dirname, `live-${name}.cpuprofile`);
		fs.writeFileSync(outPath, JSON.stringify(profile));
		profiles[name] = outPath;
	}

	console.log('\n=== fakeGame timings (from the app) ===');
	console.log(JSON.stringify(timings, null, 2));
	console.log(`(outer wall incl. CDP round-trip: ${runElapsed} ms)`);

	if (hasPerfCommands) {
		const stats = await evalIn(bg, `JSON.stringify(window.gsPerfStats(40))`);
		console.log('\n=== game-state perf buckets (top 40) ===');
		const parsed = JSON.parse(stats);
		for (const b of parsed.buckets) {
			console.log(
				`${String(Math.round(b.totalMs)).padStart(8)} ms  ${String(b.calls).padStart(7)} calls  ${b.bucket}`,
			);
		}
		console.log(`eventDispatchMs: ${parsed.eventDispatchMs}`);
	}

	console.log('\nProfiles written:');
	Object.entries(profiles).forEach(([k, v]) => console.log(` - ${k}: ${v}`));

	bg.close();
	ov?.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
