const edge = require('electron-edge-js');
const path = require('path');

class MindVisionEdge {
	constructor(pluginsDirectory = null) {
		// During build, all DLLs are copied to the same directory as index.js
		// If we're in an asar archive, redirect to the unpacked location
		let baseDir = __dirname;
		console.log('[MindVisionEdge] Original __dirname:', baseDir);
		
		// Handle both forward and backslashes, and different path formats
		if (baseDir.includes('app.asar')) {
			baseDir = baseDir.replace(/app\.asar/g, 'app.asar.unpacked');
			console.log('[MindVisionEdge] Redirected to unpacked location:', baseDir);
		}
		
		const dllPath = path.join(baseDir, 'OverwolfUnitySpy.dll');
		const newtonsoftPath = path.join(baseDir, 'Newtonsoft.Json.dll');

		console.log('[MindVisionEdge] DLL Path:', dllPath);
		console.log('[MindVisionEdge] Newtonsoft Path:', newtonsoftPath);

		// Store paths for edge function creation
		this.dllPath = dllPath;
		this.newtonsoftPath = newtonsoftPath;
		this.initialized = false;
		this.memoryUpdateCallback = null;
		this.edgeFunctionCache = new Map();
	}

	// Set the memory update callback before initialization
	setMemoryUpdateCallback(callback) {
		this.memoryUpdateCallback = callback;
	}
	setLogger(logger) {
		this.logger = logger;
	}

	// Get or create cached edge function for a specific method
	getEdgeFunction(methodName) {
		if (this.edgeFunctionCache.has(methodName)) {
			return this.edgeFunctionCache.get(methodName);
		}

		const edgeFunc = edge.func({
			assemblyFile: this.dllPath,
			typeName: 'OverwolfUnitySpy.StaticMindVisionWrapper',
			methodName: methodName,
			references: ['System.dll', 'System.Core.dll', this.newtonsoftPath],
		});

		this.edgeFunctionCache.set(methodName, edgeFunc);
		return edgeFunc;
	}

	async initialize() {
		try {
			console.log('[MindVisionEdge] Initializing plugin...');

			if (this.logger) {
				console.log('[MindVisionEdge] Setting up logger...');
				await this.callPluginMethod('setLogger', (log1, log2) => {
					if (this.logger) {
						this.logger(log1, log2);
					}
				});
				console.log('[MindVisionEdge] Logger setup complete');
			}

			// Set up memory update callback if we have one
			if (this.memoryUpdateCallback) {
				console.log('[MindVisionEdge] Setting up memory update callback...');
				await this.callPluginMethod('setMemoryUpdateCallback', (memoryUpdate) => {
					if (this.memoryUpdateCallback) {
						this.memoryUpdateCallback({ memoryUpdate });
					}
				});
				console.log('[MindVisionEdge] Memory callback setup complete');
			}

			this.initialized = true;
			console.log('[MindVisionEdge] Plugin initialized successfully');
			return true;
		} catch (error) {
			console.error('[MindVisionEdge] Initialize error:', error);
			this.initialized = false;
			return false;
		}
	}

	// Core plugin methods - these match the C# interface exactly
	async getCurrentScene() {
		return this.callPluginMethod('getCurrentScene');
	}

	async isBootstrapped(throwException = false) {
		return this.callPluginMethod('isBootstrapped', { throwException });
	}

	async getCollection(throwException = false) {
		return this.callPluginMethod('getCollection', { throwException });
	}

	async getCollectionSize(throwException = false) {
		return this.callPluginMethod('getCollectionSize', { throwException });
	}

	async getBattlegroundsOwnedHeroSkinDbfIds() {
		return this.callPluginMethod('getBattlegroundsOwnedHeroSkinDbfIds');
	}

	async getCardBacks() {
		return this.callPluginMethod('getCardBacks');
	}

	async getCoins() {
		return this.callPluginMethod('getCoins');
	}

	async getMatchInfo() {
		return this.callPluginMethod('getMatchInfo');
	}

	async getCurrentBoard() {
		return this.callPluginMethod('getCurrentBoard');
	}

	async getAdventuresInfo() {
		return this.callPluginMethod('getAdventuresInfo');
	}

	async getDungeonInfo() {
		return this.callPluginMethod('getDungeonInfo');
	}

	async getActiveDeck(selectedDeckId = 0, resetMindvision = false) {
		return this.callPluginMethod('getActiveDeck', { selectedDeckId, resetMindvision });
	}

	async getSelectedDeckId(resetMindvision = false) {
		return this.callPluginMethod('getSelectedDeckId', { resetMindvision });
	}

	async getWhizbangDeck(deckId) {
		return this.callPluginMethod('getWhizbangDeck', { deckId });
	}

	async getBattlegroundsInfo(resetMindvision = false) {
		return this.callPluginMethod('getBattlegroundsInfo', { resetMindvision });
	}

	async getBattlegroundsSelectedMode(resetMindvision = false) {
		return this.callPluginMethod('getBattlegroundsSelectedMode', { resetMindvision });
	}

	async getArenaInfo() {
		return this.callPluginMethod('getArenaInfo');
	}

	async getArenaDeck() {
		return this.callPluginMethod('getArenaDeck');
	}

	async getRewardsTrackInfo() {
		return this.callPluginMethod('getRewardsTrackInfo');
	}

	async getAchievementsInfo(resetMindvision = false) {
		return this.callPluginMethod('getAchievementsInfo', { resetMindvision });
	}

	async getAchievementCategories(resetMindvision = false) {
		return this.callPluginMethod('getAchievementCategories', { resetMindvision });
	}

	async getInGameAchievementsProgressInfo(achievementIds) {
		return this.callPluginMethod('getInGameAchievementsProgressInfo', { achievementIds });
	}

	async getInGameAchievementsProgressInfoByIndex(indexes) {
		return this.callPluginMethod('getInGameAchievementsProgressInfoByIndex', { indexes });
	}

	async getBoostersInfo() {
		return this.callPluginMethod('getBoostersInfo');
	}

	async getMercenariesInfo(resetMindvision = false) {
		return this.callPluginMethod('getMercenariesInfo', { resetMindvision });
	}

	async getMercenariesCollectionInfo(resetMindvision = false) {
		return this.callPluginMethod('getMercenariesCollectionInfo', { resetMindvision });
	}

	async getMemoryChanges() {
		return this.callPluginMethod('getMemoryChanges');
	}

	async getActiveQuests() {
		return this.callPluginMethod('getActiveQuests');
	}

	async getBgsPlayerTeammateBoard() {
		return this.callPluginMethod('getBgsPlayerTeammateBoard');
	}

	async getBgsPlayerBoard() {
		return this.callPluginMethod('getBgsPlayerBoard');
	}

	async getPlayerProfileInfo() {
		return this.callPluginMethod('getPlayerProfileInfo');
	}

	async getGameUniqueId() {
		return this.callPluginMethod('getGameUniqueId');
	}

	async getRegion() {
		return this.callPluginMethod('getRegion');
	}

	async getAccountInfo() {
		return this.callPluginMethod('getAccountInfo');
	}

	async isRunning() {
		return this.callPluginMethod('isRunning');
	}

	// Memory update listening with callback
	async listenForUpdates() {
		return this.callPluginMethod('listenForUpdates');
	}

	async stopListenForUpdates() {
		return this.callPluginMethod('stopListenForUpdates');
	}

	// Plugin lifecycle methods
	async reset() {
		return this.callPluginMethod('reset');
	}

	async tearDown() {
		const result = await this.callPluginMethod('tearDown');

		// Clean up our state
		this.initialized = false;
		this.memoryUpdateCallback = null;
		this.edgeFunctionCache.clear();

		return result;
	}

	// Helper method to call plugin methods with proper error handling
	async callPluginMethod(methodName, params = {}) {
		// console.debug('[MindVisionEdge] [debug] Calling plugin method:', methodName);
		if (!this.initialized && methodName !== 'setMemoryUpdateCallback' && methodName !== 'setLogger') {
			throw new Error('Plugin not initialized');
		}

		return new Promise((resolve, reject) => {
			try {
				// Get cached edge function for this method
				// console.debug('[MindVisionEdge] [debug] Getting edge function for:', methodName);
				const edgeFunc = this.getEdgeFunction(methodName);
				// console.debug('[MindVisionEdge] [debug]', methodName, 'Got edge function:');

				// All methods now follow the same pattern: async Task<object> MethodName(dynamic input)
				edgeFunc(params, (error, result) => {
					// console.debug('[MindVisionEdge] [debug]', methodName, 'Edge function result:', result);
					if (error) {
						reject(error);
					} else {
						this.handleMethodResult(result, methodName, resolve, reject);
					}
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	// Helper method to handle method results consistently
	handleMethodResult(result, methodName, resolve, reject) {
		// Handle special cases
		if (result === 'exception') {
			reject(new Error(`Exception occurred in ${methodName}`));
		} else if (result === null || result === undefined) {
			resolve(null);
		} else {
			// Try to parse JSON if result is a string that looks like JSON
			if (typeof result === 'string' && (result.startsWith('{') || result.startsWith('['))) {
				try {
					resolve(JSON.parse(result));
				} catch (e) {
					resolve(result);
				}
			} else {
				resolve(result);
			}
		}
	}
}

module.exports = MindVisionEdge;
