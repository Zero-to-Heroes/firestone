/**
 * Collect board→first sim paint stats from a running Overwolf dev build.
 *
 * Usage:
 *   node test-tools/perf/bgs-sim-latency-live.mjs [logFileName] [port]
 *
 * Uses full test-tools/bg.log when copied to DevService's fakeGame path.
 */
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
	if (!background) {
		console.error('Firestone - Background not found');
		process.exit(1);
	}
	const bg = await Cdp.connect(background.webSocketDebuggerUrl, 'background');
	await bg.send('Runtime.enable');

	const commands = await evalIn(
		bg,
		`JSON.stringify({ fakeGame: typeof window.fakeGame, bgsSimLatencyStats: typeof window.bgsSimLatencyStats })`,
	);
	console.log('dev commands:', commands);
	if (!commands.includes('"bgsSimLatencyStats":"function"')) {
		console.error('bgsSimLatencyStats missing — relaunch Overwolf on the measurement build.');
		process.exit(1);
	}

	await evalIn(bg, `window.bgsSimLatencyReset()`);
	console.log(`Running fakeGame('${LOG_FILE}', { isBg: true })... (full log can take several minutes)`);
	const timings = await evalIn(bg, `window.fakeGame(${JSON.stringify(LOG_FILE)}, { isBg: true })`, {
		awaitPromise: true,
	});
	const stats = await evalIn(bg, `JSON.stringify(window.bgsSimLatencyStats())`);
	console.log('\n=== fakeGame timings ===');
	console.log(JSON.stringify(timings, null, 2));
	console.log('\n=== bgsSimLatencyStats (headline = boardsVisible→kickoff) ===');
	const parsed = JSON.parse(stats);
	console.log(
		JSON.stringify(
			{
				headline: 'boardsVisible→kickoff',
				n: parsed.n,
				mean: parsed.mean,
				p50: parsed.p50,
				p90: parsed.p90,
				optionalHops: {
					kickoffToFirstResult: parsed.hops?.kickoffToFirstResult,
					resultToPaint: parsed.hops?.resultToPaint,
					boardToPaint: parsed.hops?.boardToPaint,
				},
				samples: parsed.samples?.map((s) => ({
					battleId: s.battleId,
					visibleToKickoffMs: s.visibleToKickoffMs ?? s.queueToKickoffMs,
				})),
			},
			null,
			2,
		),
	);
	console.log('\n=== full stats ===');
	console.log(stats);
	bg.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
