const edge = require('electron-edge-js');
const path = require('path');

class MindVisionEdge {
	constructor() {
		// Create the edge function that will execute our C# code
		this.edgeFunc = edge.func({
			source: path.join(__dirname, 'MindVisionBridge.cs'),
			references: [
				'System.dll',
				'System.Core.dll',
				'System.Reflection.dll',
				path.join(__dirname, 'Newtonsoft.Json.dll'),
			],
		});

		this.initialized = false;
	}

	async initialize() {
		try {
			console.log('[MindVisionEdge] Initializing plugin...');
			const result = await this.callMethod('initialize');

			if (result.success) {
				this.initialized = true;
				console.log('[MindVisionEdge] Plugin initialized successfully:', result.message);
				return true;
			} else {
				console.error('[MindVisionEdge] Failed to initialize:', result.error);
				return false;
			}
		} catch (error) {
			console.error('[MindVisionEdge] Initialize error:', error);
			return false;
		}
	}

	// Generic method wrapper that handles initialization checks and error handling
	async callPluginMethod(methodName, params = {}, options = {}) {
		const { requiresInit = true, returnProperty = null, logErrors = true } = options;

		if (requiresInit && !this.initialized) {
			throw new Error('Plugin not initialized. Call initialize() first.');
		}

		try {
			const result = await this.callMethod(methodName, params);

			if (result.success) {
				return returnProperty ? result[returnProperty] : result;
			} else if (result.error) {
				if (logErrors) {
					console.error(`[MindVisionEdge] ${methodName} error:`, result.error);
				}
				throw new Error(result.error);
			} else {
				// Some methods might return data directly without success/error structure
				return result;
			}
		} catch (error) {
			if (logErrors) {
				console.error(`[MindVisionEdge] ${methodName} error:`, error);
			}
			throw error;
		}
	}

	// Core plugin methods
	async getCurrentScene() {
		return this.callPluginMethod('getCurrentScene', {}, { returnProperty: 'scene' });
	}

	async getMemoryChanges() {
		return this.callPluginMethod('getMemoryChanges', {}, { returnProperty: 'changes' });
	}

	async isBootstrapped() {
		return this.callPluginMethod('isBootstrapped', {}, { returnProperty: 'bootstrapped' });
	}

	async listenForUpdates() {
		return this.callPluginMethod('listenForUpdates', {}, { returnProperty: 'message' });
	}

	async startListeningWithCallback(callback) {
		if (typeof callback !== 'function') {
			throw new Error('Callback must be a function');
		}

		const result = await this.callPluginMethod('StartListeningWithCallback', { callback });
		console.log('[MindVisionEdge] Started listening for memory updates with callback:', result.message);
		return result.message;
	}

	async isInitialized() {
		return this.callPluginMethod('isInitialized', {}, { requiresInit: false, logErrors: false });
	}

	// Collection methods
	async getCollection(throwException = false, debug = false) {
		return this.callPluginMethod('getCollection', { throwException, debug });
	}

	async getCollectionSize(throwException = false, debug = false) {
		return this.callPluginMethod('getCollectionSize', { throwException, debug });
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

	// Match and game state methods
	async getMatchInfo() {
		return this.callPluginMethod('getMatchInfo');
	}

	async getCurrentBoard() {
		return this.callPluginMethod('getCurrentBoard');
	}

	async getGameUniqueId() {
		return this.callPluginMethod('getGameUniqueId');
	}

	async getRegion() {
		return this.callPluginMethod('getRegion');
	}

	// Battlegrounds methods
	async getBgsPlayerTeammateBoard() {
		return this.callPluginMethod('getBgsPlayerTeammateBoard');
	}

	async getBgsPlayerBoard() {
		return this.callPluginMethod('getBgsPlayerBoard');
	}

	async getBattlegroundsInfo(forceReset = false) {
		return this.callPluginMethod('getBattlegroundsInfo', { forceReset });
	}

	async getBattlegroundsSelectedMode(forceReset = false) {
		return this.callPluginMethod('getBattlegroundsSelectedMode', { forceReset });
	}

	// Mercenaries methods
	async getMercenariesInfo(forceReset = false) {
		return this.callPluginMethod('getMercenariesInfo', { forceReset });
	}

	async getMercenariesCollectionInfo(forceReset = false) {
		return this.callPluginMethod('getMercenariesCollectionInfo', { forceReset });
	}

	// Arena methods
	async getArenaInfo() {
		return this.callPluginMethod('getArenaInfo');
	}

	async getArenaDeck() {
		return this.callPluginMethod('getArenaDeck');
	}

	// Deck methods
	async getActiveDeck(selectedDeckId, forceReset = false) {
		return this.callPluginMethod('getActiveDeck', { selectedDeckId, forceReset });
	}

	async getSelectedDeckId(forceReset) {
		return this.callPluginMethod('getSelectedDeckId', { forceReset });
	}

	async getWhizbangDeck(deckId) {
		return this.callPluginMethod('getWhizbangDeck', { deckId });
	}

	// Rewards and progression methods
	async getRewardsTrackInfo() {
		return this.callPluginMethod('getRewardsTrackInfo');
	}

	async getBoostersInfo() {
		return this.callPluginMethod('getBoostersInfo');
	}

	async getActiveQuests() {
		return this.callPluginMethod('getActiveQuests');
	}

	// Achievements methods
	async getAchievementsInfo(forceReset = false) {
		return this.callPluginMethod('getAchievementsInfo', { forceReset });
	}

	async getAchievementCategories(forceReset = false) {
		return this.callPluginMethod('getAchievementCategories', { forceReset });
	}

	async getInGameAchievementsProgressInfo(achievementIds) {
		return this.callPluginMethod('getInGameAchievementsProgressInfo', { achievementIds });
	}

	async getInGameAchievementsProgressInfoByIndex(achievementIds) {
		return this.callPluginMethod('getInGameAchievementsProgressInfoByIndex', { achievementIds });
	}

	// Player info methods
	async getPlayerProfileInfo() {
		return this.callPluginMethod('getPlayerProfileInfo');
	}

	async getAccountInfo() {
		return this.callPluginMethod('getAccountInfo');
	}

	// Plugin lifecycle methods
	async reset() {
		return this.callPluginMethod('reset');
	}

	async tearDown() {
		const result = await this.callPluginMethod('tearDown');
		this.initialized = false;
		return result;
	}

	// Low-level method for direct C# calls
	async callMethod(method, params = {}) {
		return new Promise((resolve, reject) => {
			this.edgeFunc({ method, ...params }, (error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			});
		});
	}
}

module.exports = MindVisionEdge;
