const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Linux drop-in for GameEventsEdge. Same class surface the Electron consumer expects
 * (constructor, setGameEventCallback, setLogger, initialize, initRealtimeLogConversion,
 * realtimeLogProcessing, askForGameStateUpdate, tearDown), backed by the net8.0
 * HearthstoneReplays helper over stdio JSON-RPC instead of in-process edge-js.
 *
 * HearthstoneReplays is a pure log parser (no memory reads), so this half has no Wine
 * dependency at all — it just needs the game's Power.log lines fed to realtimeLogProcessing.
 */
class GameEventsEdgeLinux {
	constructor(helperPath = null) {
		let baseDir = __dirname;
		if (baseDir.includes('app.asar')) {
			baseDir = baseDir.replace(/app\.asar/g, 'app.asar.unpacked');
		}

		this.helperPath = helperPath || path.join(baseDir, 'game-events-helper', 'FirestoneGameEventsHelper');
		this.proc = null;
		this.initialized = false;
		this.nextId = 1;
		this.pending = new Map();
		this.gameEventCallback = null;
		this.logger = null;
	}

	setGameEventCallback(callback) {
		this.gameEventCallback = callback;
	}

	setLogger(logger) {
		this.logger = logger;
	}

	async initialize() {
		try {
			if (this.proc) {
				return true;
			}

			// The nx asset-glob copy into dist strips the execute bit; restore it before spawn.
			try { fs.chmodSync(this.helperPath, 0o755); } catch (e) { /* best effort */ }
			this.proc = spawn(this.helperPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

			this.proc.on('error', (err) => this._log('helper spawn error', String(err)));
			this.proc.on('exit', (code) => {
				this._log('helper exited', String(code));
				this.initialized = false;
				this.proc = null;
				for (const [, reject] of this.pending.values()) {
					reject(new Error('game-events helper exited'));
				}
				this.pending.clear();
			});

			readline.createInterface({ input: this.proc.stdout }).on('line', (line) => this._onLine(line));
			readline.createInterface({ input: this.proc.stderr }).on('line', (line) => this._log('helper', line));

			this.initialized = true;
			return true;
		} catch (error) {
			this._log('initialize error', String(error));
			this.initialized = false;
			return false;
		}
	}

	_onLine(line) {
		if (!line || line.trim().length === 0) {
			return;
		}

		let msg;
		try {
			msg = JSON.parse(line);
		} catch (e) {
			this._log('unparseable helper output', line);
			return;
		}

		if (msg.event) {
			if (msg.event === 'gameEvent' && this.gameEventCallback) {
				this.gameEventCallback({ gameEvent: msg.data });
			}
			return;
		}

		const entry = this.pending.get(msg.id);
		if (!entry) {
			return;
		}

		this.pending.delete(msg.id);
		const [resolve, reject] = entry;
		if (msg.ok) {
			resolve(msg.result);
		} else {
			reject(new Error(msg.error || 'helper error'));
		}
	}

	_call(method, params = []) {
		return new Promise((resolve, reject) => {
			if (!this.proc || !this.initialized) {
				reject(new Error('GameEvents helper not initialized'));
				return;
			}

			const id = this.nextId++;
			this.pending.set(id, [resolve, reject]);
			try {
				this.proc.stdin.write(JSON.stringify({ id, method, params }) + '\n');
			} catch (e) {
				this.pending.delete(id);
				reject(e);
			}
		});
	}

	_log(a, b) {
		if (this.logger) {
			this.logger(a, b);
		}
	}

	// The JS callback is a local "ready" signal; the helper resolves once the parser is armed.
	async initRealtimeLogConversion(callback) {
		const result = await this._call('initRealtimeLogConversion');
		if (typeof callback === 'function') {
			callback(result);
		}
		return result;
	}

	async realtimeLogProcessing(logLines) {
		if (!Array.isArray(logLines)) {
			throw new Error('[GameEventsEdgeLinux] realtimeLogProcessing expects an array of log lines');
		}
		return this._call('realtimeLogProcessing', [logLines]);
	}

	async askForGameStateUpdate() {
		return this._call('askForGameStateUpdate');
	}

	async tearDown() {
		try {
			await this._call('tearDown');
		} catch (e) {
			// process may already be gone
		}

		if (this.proc) {
			this.proc.stdin.end();
			this.proc.kill();
			this.proc = null;
		}

		this.initialized = false;
		this.gameEventCallback = null;
		this.pending.clear();
	}
}

module.exports = GameEventsEdgeLinux;
