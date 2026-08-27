const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Linux drop-in for MindVisionEdge. Exposes the exact same class surface the Electron
 * consumer expects (constructor, setMemoryUpdateCallback, setLogger, initialize, and the
 * 36 facade methods), but instead of hosting a .NET DLL in-process via edge-js, it spawns
 * the self-contained net8.0 helper and speaks newline-delimited JSON-RPC over stdio.
 *
 * edge-js is deliberately not used on Linux: its bundled CoreCLR host is a .NET Core 2.x-era
 * fx_muxer that cannot host net8.0 (see tools/linux-probe/README.md for the full spike).
 */
class MindVisionEdgeLinux {
	constructor(helperPath = null) {
		let baseDir = __dirname;
		if (baseDir.includes('app.asar')) {
			baseDir = baseDir.replace(/app\.asar/g, 'app.asar.unpacked');
		}

		// The self-contained publish output; the native launcher needs no system .NET.
		this.helperPath = helperPath || path.join(baseDir, 'mindvision-helper', 'FirestoneMindVisionHelper');
		this.proc = null;
		this.initialized = false;
		this.nextId = 1;
		this.pending = new Map();
		this.memoryUpdateCallback = null;
		this.logger = null;
	}

	setMemoryUpdateCallback(callback) {
		this.memoryUpdateCallback = callback;
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
				// Fail any in-flight calls so callers don't hang.
				for (const [, reject] of this.pending.values()) {
					reject(new Error('helper process exited'));
				}
				this.pending.clear();
			});

			// stdout is protocol only, one JSON object per line.
			readline.createInterface({ input: this.proc.stdout }).on('line', (line) => this._onLine(line));
			// stderr is the helper's log channel.
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

		// Push events (memory updates) carry no id.
		if (msg.event) {
			if (msg.event === 'memoryUpdate' && this.memoryUpdateCallback) {
				this.memoryUpdateCallback({ memoryUpdate: msg.data });
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
				reject(new Error('MindVision helper not initialized'));
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

	// ---- facade surface: each forwards to the helper by method name ----------------
	getCurrentScene() { return this._call('getCurrentScene'); }
	isBootstrapped() { return this._call('isBootstrapped'); }
	getCollection(throwException = false) { return this._call('getCollection', [throwException]); }
	getCollectionSize(throwException = false) { return this._call('getCollectionSize', [throwException]); }
	getBattlegroundsOwnedHeroSkinDbfIds() { return this._call('getBattlegroundsOwnedHeroSkinDbfIds'); }
	getCardBacks() { return this._call('getCardBacks'); }
	getCoins() { return this._call('getCoins'); }
	getMatchInfo() { return this._call('getMatchInfo'); }
	getCurrentBoard() { return this._call('getCurrentBoard'); }
	getAdventuresInfo() { return this._call('getAdventuresInfo'); }
	getDungeonInfo() { return this._call('getDungeonInfo'); }
	getActiveDeck(selectedDeckId = 0) { return this._call('getActiveDeck', [selectedDeckId]); }
	getSelectedDeckId() { return this._call('getSelectedDeckId'); }
	getWhizbangDeck(deckId) { return this._call('getWhizbangDeck', [deckId]); }
	getBattlegroundsInfo() { return this._call('getBattlegroundsInfo'); }
	getBattlegroundsSelectedMode() { return this._call('getBattlegroundsSelectedMode'); }
	getArenaInfo() { return this._call('getArenaInfo'); }
	getArenaDeck() { return this._call('getArenaDeck'); }
	getRewardsTrackInfo() { return this._call('getRewardsTrackInfo'); }
	getAchievementsInfo() { return this._call('getAchievementsInfo'); }
	getAchievementCategories() { return this._call('getAchievementCategories'); }
	getInGameAchievementsProgressInfo(achievementIds) { return this._call('getInGameAchievementsProgressInfo', [achievementIds]); }
	getInGameAchievementsProgressInfoByIndex(indexes) { return this._call('getInGameAchievementsProgressInfoByIndex', [indexes]); }
	getBoostersInfo() { return this._call('getBoostersInfo'); }
	getMercenariesInfo() { return this._call('getMercenariesInfo'); }
	getMercenariesCollectionInfo() { return this._call('getMercenariesCollectionInfo'); }
	getMemoryChanges() { return this._call('getMemoryChanges'); }
	getActiveQuests() { return this._call('getActiveQuests'); }
	getBgsPlayerTeammateBoard() { return this._call('getBgsPlayerTeammateBoard'); }
	getBgsPlayerBoard() { return this._call('getBgsPlayerBoard'); }
	getPlayerProfileInfo() { return this._call('getPlayerProfileInfo'); }
	getGameUniqueId() { return this._call('getGameUniqueId'); }
	getRegion() { return this._call('getRegion'); }
	getAccountInfo() { return this._call('getAccountInfo'); }
	isRunning() { return this._call('isRunning'); }
	listenForUpdates() { return this._call('listenForUpdates'); }
	stopListenForUpdates() { return this._call('stopListenForUpdates'); }
	reset() { return this._call('reset'); }

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
		this.memoryUpdateCallback = null;
		this.pending.clear();
	}
}

module.exports = MindVisionEdgeLinux;
