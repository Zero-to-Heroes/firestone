import { Injectable } from '@angular/core';
import { Board } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { ArenaInfo } from '@models/arena-info';
import { BoostersInfo } from '@models/memory/boosters-info';
import { CoinInfo } from '@models/memory/coin-info';
import { AdventuresInfo, DuelsDeck, MemoryDuelsHeroPowerOption } from '@models/memory/memory-duels';
import { MemoryMercenariesCollectionInfo } from '@models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '@models/memory/memory-mercenaries-info';
import { MemoryUpdate } from '@models/memory/memory-update';
import { RewardsTrackInfo } from '@models/rewards-track-info';
import { InternalHsAchievementsInfo } from './operations/get-achievements-info-operation';

declare let OverwolfPlugin: any;

// Should not be called from outside its package.
// Use MindVisionStateMachine instead
@Injectable()
export class MindVisionFacadeService {
	public globalEventListener: (first: string, second: string) => Promise<void>;
	public memoryUpdateListener: (changes: string | 'reset') => Promise<void>;

	private mindVisionPlugin: any;
	private initialized = false;

	public async listenForUpdates() {
		return new Promise<void>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.listenForUpdates((result) => {
					console.log('[mind-vision] listenForUpdates callback result: ', result);
					resolve();
				});
			} catch (e) {
				console.error('[mind-vision] could not listenForUpdates', e);
				resolve();
			}
		});
	}

	public async getMemoryChanges(): Promise<MemoryUpdate> {
		return new Promise<MemoryUpdate>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getMemoryChanges((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse memory update', e);
				resolve(null);
			}
		});
	}

	public async getCollection(): Promise<any[]> {
		return new Promise<any[]>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getCollection((collection) => {
					resolve(collection ? JSON.parse(collection) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse collection', e);
				resolve(null);
			}
		});
	}

	public async getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[]> {
		return new Promise<readonly number[]>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getBattlegroundsOwnedHeroSkinDbfIds((collection) => {
					resolve(collection ? JSON.parse(collection) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getBattlegroundsOwnedHeroSkinDbfIds', e);
				resolve(null);
			}
		});
	}

	public async getCardBacks(): Promise<any[]> {
		return new Promise<any[]>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getCardBacks((cardBacks) => {
					resolve(cardBacks ? JSON.parse(cardBacks) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getCardBacks', e);
				resolve(null);
			}
		});
	}

	public async getCoins(): Promise<CoinInfo[]> {
		return new Promise<CoinInfo[]>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getCoins((cardBacks) => {
					resolve(cardBacks ? JSON.parse(cardBacks) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getCoins', e);
				resolve(null);
			}
		});
	}

	public async getMatchInfo(): Promise<any> {
		return new Promise<any[]>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getMatchInfo((matchInfo) => {
					resolve(matchInfo ? JSON.parse(matchInfo) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse matchInfo', e);
				resolve(null);
			}
		});
	}

	public async getCurrentBoard(): Promise<Board> {
		return new Promise<Board>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getCurrentBoard((matchInfo) => {
					resolve(matchInfo ? JSON.parse(matchInfo) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse matchInfo', e);
				resolve(null);
			}
		});
	}

	public async getAdventuresInfo(): Promise<AdventuresInfo> {
		return new Promise<AdventuresInfo>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getAdventuresInfo((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getAdventuresInfo', e);
				resolve(null);
			}
		});
	}

	public async getDuelsInfo(forceReset = false): Promise<any> {
		return new Promise<any[]>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse duelsInfo', e);
				resolve(null);
			}
		});
	}

	public async getDuelsDeck(): Promise<DuelsDeck> {
		return new Promise<DuelsDeck>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsDeck((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getDuelsDeck', e);
				resolve(null);
			}
		});
	}

	public async getDuelsHeroOptions(): Promise<readonly number[]> {
		return new Promise<readonly number[]>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsHeroOptions((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getDuelsHeroOptions', e);
				resolve(null);
			}
		});
	}

	public async getDuelsHeroPowerOptions(): Promise<readonly MemoryDuelsHeroPowerOption[]> {
		return new Promise<readonly MemoryDuelsHeroPowerOption[]>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsHeroPowerOptions((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getDuelsHeroPowerOptions', e);
				resolve(null);
			}
		});
	}

	public async getDuelsSignatureTreasureOptions(): Promise<readonly MemoryDuelsHeroPowerOption[]> {
		return new Promise<readonly MemoryDuelsHeroPowerOption[]>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsSignatureTreasureOptions((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getDuelsSignatureTreasureOptions', e);
				resolve(null);
			}
		});
	}

	public async getBattlegroundsInfo(forceReset = false): Promise<{ Rating: number }> {
		return new Promise<{ Rating: number }>(async (resolve) => {
			if (forceReset) {
			}
			const plugin = await this.get();
			try {
				plugin.getBattlegroundsInfo(forceReset, (battlegroundsInfo) => {
					resolve(battlegroundsInfo ? JSON.parse(battlegroundsInfo) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse battlegroundsInfo', e);
				resolve(null);
			}
		});
	}

	public async getMercenariesInfo(forceReset = false): Promise<MemoryMercenariesInfo> {
		return new Promise<MemoryMercenariesInfo>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getMercenariesInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getMercenariesInfo', e);
				resolve(null);
			}
		});
	}

	public async getMercenariesCollectionInfo(forceReset = false): Promise<MemoryMercenariesCollectionInfo> {
		return new Promise<MemoryMercenariesCollectionInfo>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getMercenariesCollectionInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getMercenariesCollectionInfo', e);
				resolve(null);
			}
		});
	}

	public async getArenaInfo(): Promise<ArenaInfo> {
		return new Promise<ArenaInfo>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getArenaInfo((arenaInfo) => {
					resolve(arenaInfo ? JSON.parse(arenaInfo) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getArenaInfo', e);
				resolve(null);
			}
		});
	}

	public async getActiveDeck(selectedDeckId: number, forceReset = false): Promise<any> {
		return new Promise<any[]>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getActiveDeck(selectedDeckId, forceReset, (activeDeck) => {
					resolve(activeDeck ? JSON.parse(activeDeck) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse activeDeck', e);
				resolve(null);
			}
		});
	}

	public async getSelectedDeckId(forceReset: boolean): Promise<number> {
		return new Promise<number>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getSelectedDeckId(forceReset, (activeDeck) => {
					resolve(activeDeck);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getSelectedDeckId', e);
				resolve(null);
			}
		});
	}

	public async getWhizbangDeck(deckId: number): Promise<any> {
		return new Promise<any[]>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getWhizbangDeck(deckId, (deck) => {
					resolve(deck ? JSON.parse(deck) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getWhizbangDeck', e);
				resolve(null);
			}
		});
	}

	public async getRewardsTrackInfo(): Promise<RewardsTrackInfo> {
		return new Promise<RewardsTrackInfo>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getRewardsTrackInfo((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse rewards track info', e);
				resolve(null);
			}
		});
	}

	public async getDuelsRewardsInfo(forceReset = false): Promise<DuelsRewardsInfo> {
		return new Promise<DuelsRewardsInfo>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsRewardsInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse rewards track info', e);
				resolve(null);
			}
		});
	}

	public async getAchievementsInfo(forceReset = false): Promise<InternalHsAchievementsInfo> {
		return new Promise<InternalHsAchievementsInfo>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getAchievementsInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not get achievements info', e);
				resolve(null);
			}
		});
	}

	public async getInGameAchievementsProgressInfo(forceReset = false): Promise<InternalHsAchievementsInfo> {
		return new Promise<InternalHsAchievementsInfo>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getInGameAchievementsProgressInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not get achievements info', e);
				resolve(null);
			}
		});
	}

	public async getCurrentScene(): Promise<number> {
		return new Promise<number>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getCurrentScene((scene) => {
					resolve(scene);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse activeDeck', e);
				resolve(null);
			}
		});
	}

	public async getBoostersInfo(): Promise<BoostersInfo> {
		return new Promise<BoostersInfo>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getBoostersInfo((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse getBoostersInfo', e);
				resolve(null);
			}
		});
	}

	// public async isMaybeOnDuelsRewardsScreen(): Promise<boolean> {
	// 	return new Promise<boolean>(async (resolve) => {
	// 		const plugin = await this.get();
	// 		try {
	// 			plugin.isMaybeOnDuelsRewardsScreen((result) => {
	// 				resolve(result);
	// 			});
	// 		} catch (e) {
	// 			console.log('[mind-vision] could not parse isMaybeOnDuelsRewardsScreen', e);
	// 			resolve(null);
	// 		}
	// 	});
	// }

	public async reset(): Promise<void> {
		console.log('[mind-vision] calling reset');
		return new Promise<void>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.reset((result) => {
					console.log('[mind-vision] reset done');
					resolve();
				});
			} catch (e) {
				console.log('[mind-vision] could not reset', e);
				resolve(null);
			}
		});
	}

	public async tearDown(): Promise<void> {
		console.log('[mind-vision] calling tearDown');
		return new Promise<void>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.onMemoryUpdate.removeListener(this.memoryUpdateListener);
				plugin.onGlobalEvent.removeListener(this.globalEventListener);
				plugin.tearDown((result) => {
					console.log('[mind-vision] tearDown done');
					resolve();
				});
			} catch (e) {
				console.log('[mind-vision] could not tearDown', e);
				resolve(null);
			}
		});
	}

	public async initializePlugin() {
		return new Promise<void>(async (resolve) => {
			this.instantiatePlugin(async () => {
				const plugin = await this.get();
				console.debug('[mind-vision] adding listener', plugin.onGlobalEvent);
				if (this.globalEventListener) {
					plugin.onGlobalEvent.removeListener(this.globalEventListener);
				}
				plugin.onGlobalEvent.addListener(this.globalEventListener);

				console.debug('[mind-vision] adding listener', plugin.onMemoryUpdate);
				if (this.memoryUpdateListener) {
					plugin.onMemoryUpdate.removeListener(this.memoryUpdateListener);
				}
				plugin.onMemoryUpdate.addListener(this.memoryUpdateListener);
				resolve();
			});
		});
	}

	private async get() {
		await this.waitForInit();
		return this.mindVisionPlugin.get();
	}

	private async instantiatePlugin(callback) {
		this.mindVisionPlugin = new OverwolfPlugin('mind-vision', true);
		this.mindVisionPlugin.initialize(async (status: boolean) => {
			if (status === false) {
				console.error("[mind-vision] Plugin couldn't be loaded??", 'retrying');
				setTimeout(() => this.instantiatePlugin(callback), 2000);
				return;
			}
			console.log('[mind-vision] Plugin ' + this.mindVisionPlugin.get()._PluginName_ + ' was loaded!');
			this.initialized = true;
			callback();
		});
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.initialized) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 500);
				}
			};
			dbWait();
		});
	}
}
