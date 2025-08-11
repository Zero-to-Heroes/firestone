import { BnetRegion, Board } from '@firestone-hs/reference-data';
import {
	AccountInfo,
	ArenaInfo,
	BoostersInfo,
	CoinInfo,
	DeckInfoFromMemory,
	IMindVisionFacade,
	InternalHsAchievementsCategory,
	InternalHsAchievementsInfo,
	MemoryBgsPlayerInfo,
	MemoryMercenariesCollectionInfo,
	MemoryMercenariesInfo,
	MemoryPlayerProfileInfo,
	MemoryQuestsLog,
	MemoryUpdate,
	MemoryUpdatesService,
	RewardsTrackInfos,
} from '@firestone/memory';
import App from '../app';

export class MindVisionElectronService implements IMindVisionFacade {
	private mindVision: any;

	private initialized = false;
	private initializationRetries = 0;
	private maxRetries = 3;

	// Event listeners required by interface
	// Not used at the moment, it's for error handling and we still have time before we get to this :)
	public globalEventListener: (first: string, second: string) => Promise<void> = async () => {};
	// Not used, we go through the MemoryUpdatesService instead directly
	public memoryUpdateListener: (changes: string | 'reset') => Promise<void> = async () => {};

	constructor(private readonly memoryUpdates: MemoryUpdatesService) {
		// Delay initialization to allow overlay to be ready first
		// It will be initialized manually in mind-vision-state-init
		// setTimeout(() => this.initializePluginInternal(), 2000);
	}

	public async initializePlugin(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.initializePluginInternal().then(() => resolve());
		});
	}

	private async initializePluginInternal() {
		try {
			console.log('[MindVisionElectron] Attempting to initialize MindVision...');

			// Try to load the Edge.js wrapper
			const path = require('path');
			const mindVisionPath = path.join(__dirname, 'electron-edge-libs');
			console.log('[MindVisionElectron] Looking for module at:', mindVisionPath);

			// Clear module cache to ensure we get the latest version
			const indexPath = path.join(mindVisionPath, 'mind-vision-edge.js');
			if (eval('require').cache[indexPath]) {
				console.log('[MindVisionElectron] Clearing cached module...');
				delete eval('require').cache[indexPath];
			}

			// Use eval to bypass webpack's module resolution
			const MindVisionEdge = eval('require')(indexPath);
			this.mindVision = new MindVisionEdge();

			// Set up memory update callback before initialization
			this.mindVision.setMemoryUpdateCallback((updateData: any) => {
				if (updateData && updateData.memoryUpdate) {
					// console.debug('[MindVisionElectron] Memory update received:', updateData.memoryUpdate);

					// Handle both string and object formats
					let parsedUpdate;
					if (typeof updateData.memoryUpdate === 'string') {
						try {
							parsedUpdate = JSON.parse(updateData.memoryUpdate);
						} catch (e) {
							console.warn('[MindVisionElectron] Failed to parse memory update:', e);
							return;
						}
					} else {
						parsedUpdate = updateData.memoryUpdate;
					}

					this.memoryUpdates.newUpdate(parsedUpdate);
				}
			});
			this.mindVision.setLogger((log1, log2) => {
				console.log('[MindVisionElectron]', log1, log2);
			});

			console.log('[MindVisionElectron] Initializing plugin...');
			const success = await this.mindVision.initialize();

			if (success) {
				this.initialized = true;
				console.log('[MindVisionElectron] Plugin initialized successfully!');
				this.updateOverlayStatus('Connected');
				// this.startListeningForUpdates();
			} else {
				console.error('[MindVisionElectron] Failed to initialize plugin');
				this.updateOverlayStatus('Failed to initialize');
			}
		} catch (error) {
			console.error('[MindVisionElectron] Error initializing MindVision:', error);
			this.initializationRetries++;

			if (this.initializationRetries < this.maxRetries) {
				console.log(
					`[MindVisionElectron] Retrying initialization in 5 seconds... (${this.initializationRetries}/${this.maxRetries})`,
				);
				setTimeout(() => this.initializePluginInternal(), 5000);
			} else {
				console.error('[MindVisionElectron] Max retries reached. MindVision will not be available.');
				this.updateOverlayStatus('Failed to load MindVision plugin');
				throw new Error('Failed to load MindVision plugin');
			}
		}
	}

	private async startListeningForUpdates() {
		try {
			console.log('[MindVisionElectron] Starting to listen for memory updates...');

			// Start listening for memory updates (callback was already set during initialization)
			await this.mindVision.listenForUpdates();

			console.log(
				'[MindVisionElectron] Successfully started listening for memory updates with real-time callback',
			);
			this.updateOverlayStatus('Listening for real-time memory updates...');
		} catch (error) {
			console.error('[MindVisionElectron] Error starting memory update listener:', error);
			this.updateOverlayStatus('Failed to start listener');
		}
	}

	public isInitialized(): boolean {
		return this.initialized;
	}

	public destroy() {
		this.initialized = false;
	}

	private updateOverlayStatus(status: string) {
		if (App.overlay) {
			// App.overlay.updateSceneDisplay(this.currentScene, status);
		}
	}

	// Core functionality methods
	public async listenForUpdates(): Promise<void> {
		if (!this.initialized) {
			throw new Error('MindVision not initialized');
		}
		return this.startListeningForUpdates();
	}

	public async isBootstrapped(): Promise<boolean | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.isBootstrapped();
		} catch (error) {
			console.warn('[MindVisionElectron] Error checking bootstrap status:', error);
			return null;
		}
	}

	public async getMemoryChanges(): Promise<MemoryUpdate | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getMemoryChanges();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting memory changes:', error);
			return null;
		}
	}

	// Collection methods
	public async getCollection(throwException = false, debug = false): Promise<any[] | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getCollection(throwException, debug);
		} catch (error) {
			if (throwException) throw error;
			console.warn('[MindVisionElectron] Error getting collection:', error);
			return null;
		}
	}

	public async getCollectionSize(throwException = false, debug = false): Promise<number | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getCollectionSize(throwException, debug);
		} catch (error) {
			if (throwException) throw error;
			console.warn('[MindVisionElectron] Error getting collection size:', error);
			return null;
		}
	}

	public async getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[] | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getBattlegroundsOwnedHeroSkinDbfIds();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting BG hero skin IDs:', error);
			return null;
		}
	}

	public async getCardBacks(): Promise<any[] | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getCardBacks();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting card backs:', error);
			return null;
		}
	}

	public async getCoins(): Promise<CoinInfo[] | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getCoins();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting coins:', error);
			return null;
		}
	}

	// Match and game state methods
	public async getMatchInfo(): Promise<any> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getMatchInfo();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting match info:', error);
			return null;
		}
	}

	public async getCurrentBoard(): Promise<Board | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getCurrentBoard();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting current board:', error);
			return null;
		}
	}

	public async getCurrentScene(): Promise<number | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getCurrentScene();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting current scene:', error);
			return null;
		}
	}

	public async getGameUniqueId(): Promise<string | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getGameUniqueId();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting game unique ID:', error);
			return null;
		}
	}

	public async getRegion(): Promise<BnetRegion | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getRegion();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting region:', error);
			return null;
		}
	}

	// Battlegrounds methods
	public async getBgsPlayerTeammateBoard(): Promise<MemoryBgsPlayerInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getBgsPlayerTeammateBoard();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting BG teammate board:', error);
			return null;
		}
	}

	public async getBgsPlayerBoard(): Promise<MemoryBgsPlayerInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getBgsPlayerBoard();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting BG player board:', error);
			return null;
		}
	}

	public async getBattlegroundsInfo(forceReset = false): Promise<{ Rating: number } | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getBattlegroundsInfo(forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting BG info:', error);
			return null;
		}
	}

	public async getBattlegroundsSelectedMode(forceReset = false): Promise<'solo' | 'duos' | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getBattlegroundsSelectedMode(forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting BG selected mode:', error);
			return null;
		}
	}

	// Mercenaries methods
	public async getMercenariesInfo(forceReset = false): Promise<MemoryMercenariesInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getMercenariesInfo(forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting mercenaries info:', error);
			return null;
		}
	}

	public async getMercenariesCollectionInfo(forceReset = false): Promise<MemoryMercenariesCollectionInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getMercenariesCollectionInfo(forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting mercenaries collection info:', error);
			return null;
		}
	}

	// Arena methods
	public async getArenaInfo(): Promise<ArenaInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getArenaInfo();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting arena info:', error);
			return null;
		}
	}

	public async getArenaDeck(): Promise<DeckInfoFromMemory | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getArenaDeck();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting arena deck:', error);
			return null;
		}
	}

	// Deck methods
	public async getActiveDeck(selectedDeckId: number | undefined, forceReset = false): Promise<any> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getActiveDeck(selectedDeckId, forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting active deck:', error);
			return null;
		}
	}

	public async getSelectedDeckId(forceReset: boolean): Promise<number | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getSelectedDeckId(forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting selected deck ID:', error);
			return null;
		}
	}

	public async getWhizbangDeck(deckId: number | undefined): Promise<any> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getWhizbangDeck(deckId);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting Whizbang deck:', error);
			return null;
		}
	}

	// Rewards and progression methods
	public async getRewardsTrackInfo(): Promise<RewardsTrackInfos | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getRewardsTrackInfo();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting rewards track info:', error);
			return null;
		}
	}

	public async getBoostersInfo(): Promise<BoostersInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getBoostersInfo();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting boosters info:', error);
			return null;
		}
	}

	public async getActiveQuests(): Promise<MemoryQuestsLog | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getActiveQuests();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting active quests:', error);
			return null;
		}
	}

	// Achievements methods
	public async getAchievementsInfo(forceReset = false): Promise<InternalHsAchievementsInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getAchievementsInfo(forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting achievements info:', error);
			return null;
		}
	}

	public async getAchievementCategories(
		forceReset = false,
	): Promise<readonly InternalHsAchievementsCategory[] | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getAchievementCategories(forceReset);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting achievement categories:', error);
			return null;
		}
	}

	public async getInGameAchievementsProgressInfo(
		achievementIds: readonly number[],
	): Promise<InternalHsAchievementsInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getInGameAchievementsProgressInfo(achievementIds);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting in-game achievements progress:', error);
			return null;
		}
	}

	public async getInGameAchievementsProgressInfoByIndex(
		achievementIds: readonly number[],
	): Promise<InternalHsAchievementsInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getInGameAchievementsProgressInfoByIndex(achievementIds);
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting in-game achievements progress by index:', error);
			return null;
		}
	}

	// Player info methods
	public async getPlayerProfileInfo(): Promise<MemoryPlayerProfileInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getPlayerProfileInfo();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting player profile info:', error);
			return null;
		}
	}

	public async getAccountInfo(): Promise<AccountInfo | null> {
		if (!this.initialized || !this.mindVision) {
			return null;
		}
		try {
			return await this.mindVision.getAccountInfo();
		} catch (error) {
			console.warn('[MindVisionElectron] Error getting account info:', error);
			return null;
		}
	}

	// Plugin lifecycle methods
	public async reset(): Promise<void> {
		if (!this.initialized || !this.mindVision) {
			return;
		}
		try {
			await this.mindVision.reset();
		} catch (error) {
			console.warn('[MindVisionElectron] Error resetting:', error);
		}
	}

	public async tearDown(): Promise<void> {
		if (!this.initialized || !this.mindVision) {
			return;
		}
		try {
			await this.mindVision.tearDown();
			this.initialized = false;
		} catch (error) {
			console.warn('[MindVisionElectron] Error tearing down:', error);
		}
	}
}
