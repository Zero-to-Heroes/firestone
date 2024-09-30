/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-async-promise-executor */
import { Injectable } from '@angular/core';
import { Board } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { ArenaInfo } from '../../external-models/arena-info';
import { MemoryBgsPlayerInfo } from '../../models/battlegrounds-player-state';
import { BoostersInfo } from '../../models/boosters-info';
import { CoinInfo } from '../../models/coin-info';
import { DeckInfoFromMemory } from '../../models/deck-info-from-memory';
import { AdventuresInfo, DuelsDeck, MemoryDuelsHeroPowerOption } from '../../models/memory-duels';
import { MemoryMercenariesCollectionInfo } from '../../models/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory-mercenaries-info';
import { MemoryPlayerProfileInfo } from '../../models/memory-profile-info';
import { MemoryUpdate } from '../../models/memory-update';
import { MemoryQuestsLog } from '../../models/quests';
import { RewardsTrackInfos } from '../../models/rewards-track-info';
import { InternalHsAchievementsCategory } from './operations/get-achievements-categories-operation';
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

	public async getMemoryChanges(): Promise<MemoryUpdate | null> {
		return new Promise<MemoryUpdate | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getMemoryChanges((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse memory update', e);
				resolve(null);
			}
		});
	}

	public async getCollection(throwException = false, debug = false): Promise<any[] | null> {
		return new Promise<any[] | null>(async (resolve, reject) => {
			const plugin = await this.get();
			plugin.getCollection(throwException, (collection) => {
				if (collection === 'exception') {
					if (debug) {
						console.log('[mind-vision] could not get collection', collection);
					}
					reject();
					return;
				}

				try {
					if (debug && !collection) {
						console.log('[mind-vision] could not get collection', collection);
					}
					resolve(collection ? JSON.parse(collection) : null);
				} catch (e) {
					console.warn('[mind-vision] could not parse collection', e);
					resolve(null);
				}
			});
		});
	}

	public async getCollectionSize(throwException = false, debug = false): Promise<number | null> {
		return new Promise<number | null>(async (resolve, reject) => {
			const plugin = await this.get();
			plugin.getCollectionSize(throwException, (collectionSize) => {
				try {
					resolve(collectionSize);
				} catch (e) {
					console.warn('[mind-vision] could not parse getCollectionSize', e);
					resolve(null);
				}
			});
		});
	}

	public async getBattlegroundsOwnedHeroSkinDbfIds(): Promise<readonly number[] | null> {
		return new Promise<readonly number[] | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getBattlegroundsOwnedHeroSkinDbfIds((collection) => {
					resolve(collection ? JSON.parse(collection) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getBattlegroundsOwnedHeroSkinDbfIds', e);
				resolve(null);
			}
		});
	}

	public async getCardBacks(): Promise<any[] | null> {
		return new Promise<any[] | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getCardBacks((cardBacks) => {
					resolve(cardBacks ? JSON.parse(cardBacks) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getCardBacks', e);
				resolve(null);
			}
		});
	}

	public async getCoins(): Promise<CoinInfo[] | null> {
		return new Promise<CoinInfo[] | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getCoins((cardBacks) => {
					resolve(cardBacks ? JSON.parse(cardBacks) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getCoins', e);
				resolve(null);
			}
		});
	}

	public async getMatchInfo(): Promise<any> {
		return new Promise<any>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getMatchInfo((matchInfo) => {
					resolve(matchInfo ? JSON.parse(matchInfo) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse matchInfo', e);
				resolve(null);
			}
		});
	}

	public async getCurrentBoard(): Promise<Board | null> {
		return new Promise<Board | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getCurrentBoard((matchInfo) => {
					resolve(matchInfo ? JSON.parse(matchInfo) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse matchInfo', e);
				resolve(null);
			}
		});
	}

	public async getAdventuresInfo(): Promise<AdventuresInfo | null> {
		return new Promise<AdventuresInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getAdventuresInfo((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getAdventuresInfo', e);
				resolve(null);
			}
		});
	}

	public async getDuelsInfo(forceReset = false): Promise<any | null> {
		return new Promise<any | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse duelsInfo', e);
				resolve(null);
			}
		});
	}

	public async getDuelsDeck(): Promise<DuelsDeck | null> {
		return new Promise<DuelsDeck | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsDeck((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getDuelsDeck', e);
				resolve(null);
			}
		});
	}

	public async getDuelsDeckFromCollection(): Promise<DeckInfoFromMemory | null> {
		return new Promise<DeckInfoFromMemory | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsDeckFromCollection((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getDuelsDeckFromCollection', e);
				resolve(null);
			}
		});
	}

	public async getDuelsHeroOptions(): Promise<readonly MemoryDuelsHeroPowerOption[] | null> {
		return new Promise<readonly MemoryDuelsHeroPowerOption[] | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsHeroOptions((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getDuelsHeroOptions', e);
				resolve(null);
			}
		});
	}

	public async getDuelsHeroPowerOptions(): Promise<readonly MemoryDuelsHeroPowerOption[] | null> {
		return new Promise<readonly MemoryDuelsHeroPowerOption[] | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsHeroPowerOptions((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getDuelsHeroPowerOptions', e);
				resolve(null);
			}
		});
	}

	public async getDuelsSignatureTreasureOptions(): Promise<readonly MemoryDuelsHeroPowerOption[] | null> {
		return new Promise<readonly MemoryDuelsHeroPowerOption[] | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsSignatureTreasureOptions((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getDuelsSignatureTreasureOptions', e);
				resolve(null);
			}
		});
	}

	public async getBgsPlayerTeammateBoard(): Promise<MemoryBgsPlayerInfo | null> {
		return new Promise<MemoryBgsPlayerInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getBgsPlayerTeammateBoard((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getBgsPlayerTeammateBoard', e);
				resolve(null);
			}
		});
	}

	public async getBgsPlayerBoard(): Promise<MemoryBgsPlayerInfo | null> {
		return new Promise<MemoryBgsPlayerInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getBgsPlayerBoard((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getBgsPlayerBoard', e);
				resolve(null);
			}
		});
	}

	public async getBattlegroundsInfo(forceReset = false): Promise<{ Rating: number } | null> {
		return new Promise<{ Rating: number } | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getBattlegroundsInfo(forceReset, (battlegroundsInfo) => {
					resolve(battlegroundsInfo ? JSON.parse(battlegroundsInfo) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse battlegroundsInfo', e);
				resolve(null);
			}
		});
	}

	public async getBattlegroundsSelectedMode(forceReset = false): Promise<'solo' | 'duos' | null> {
		return new Promise<'solo' | 'duos' | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getBattlegroundsSelectedMode(forceReset, (battlegroundsInfo) => {
					resolve(battlegroundsInfo ? JSON.parse(battlegroundsInfo) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getBattlegroundsSelectedMode', e);
				resolve(null);
			}
		});
	}

	public async getMercenariesInfo(forceReset = false): Promise<MemoryMercenariesInfo | null> {
		return new Promise<MemoryMercenariesInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getMercenariesInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getMercenariesInfo', e);
				resolve(null);
			}
		});
	}

	public async getMercenariesCollectionInfo(forceReset = false): Promise<MemoryMercenariesCollectionInfo | null> {
		return new Promise<MemoryMercenariesCollectionInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getMercenariesCollectionInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getMercenariesCollectionInfo', e);
				resolve(null);
			}
		});
	}

	public async getArenaInfo(): Promise<ArenaInfo | null> {
		return new Promise<ArenaInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getArenaInfo((arenaInfo) => {
					resolve(arenaInfo ? JSON.parse(arenaInfo) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getArenaInfo', e);
				resolve(null);
			}
		});
	}

	public async getArenaDeck(): Promise<DeckInfoFromMemory | null> {
		return new Promise<DeckInfoFromMemory | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getArenaDeck((deck) => {
					resolve(deck ? JSON.parse(deck) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getArenaDeck', e);
				resolve(null);
			}
		});
	}

	public async getActiveDeck(selectedDeckId: number | undefined, forceReset = false): Promise<any> {
		return new Promise<any>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getActiveDeck(selectedDeckId, forceReset, (activeDeck) => {
					resolve(activeDeck ? JSON.parse(activeDeck) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse activeDeck', e);
				resolve(null);
			}
		});
	}

	public async getSelectedDeckId(forceReset: boolean): Promise<number | null> {
		return new Promise<number | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getSelectedDeckId(forceReset, (activeDeck) => {
					resolve(activeDeck);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getSelectedDeckId', e);
				resolve(null);
			}
		});
	}

	public async getWhizbangDeck(deckId: number | undefined): Promise<any> {
		return new Promise<any>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getWhizbangDeck(deckId, (deck) => {
					resolve(deck ? JSON.parse(deck) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getWhizbangDeck', e);
				resolve(null);
			}
		});
	}

	public async getRewardsTrackInfo(): Promise<RewardsTrackInfos | null> {
		return new Promise<RewardsTrackInfos | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getRewardsTrackInfo((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse rewards track info', e);
				resolve(null);
			}
		});
	}

	public async getDuelsRewardsInfo(forceReset = false): Promise<DuelsRewardsInfo | null> {
		return new Promise<DuelsRewardsInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getDuelsRewardsInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse rewards track info', e);
				resolve(null);
			}
		});
	}

	public async getAchievementsInfo(forceReset = false): Promise<InternalHsAchievementsInfo | null> {
		return new Promise<InternalHsAchievementsInfo | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getAchievementsInfo(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not get achievements info', e);
				resolve(null);
			}
		});
	}

	public async getAchievementCategories(
		forceReset = false,
	): Promise<readonly InternalHsAchievementsCategory[] | null> {
		return new Promise<readonly InternalHsAchievementsCategory[] | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				plugin.getAchievementCategories(forceReset, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not getAchievementCategories', e);
				resolve(null);
			}
		});
	}

	public async getInGameAchievementsProgressInfo(
		achievementIds: readonly number[],
	): Promise<InternalHsAchievementsInfo | null> {
		return new Promise<InternalHsAchievementsInfo | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				// console.debug(
				// 	'getting in game achievements progress info',
				// 	achievementIds,
				// 	plugin,
				// 	plugin.getInGameAchievementsProgressInfo,
				// );
				plugin.getInGameAchievementsProgressInfo(achievementIds, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not get achievements info', e);
				resolve(null);
			}
		});
	}

	public async getInGameAchievementsProgressInfoByIndex(
		achievementIds: readonly number[],
	): Promise<InternalHsAchievementsInfo | null> {
		return new Promise<InternalHsAchievementsInfo | null>(async (resolve, reject) => {
			const plugin = await this.get();
			try {
				// console.debug(
				// 	'getting in game achievements progress info',
				// 	achievementIds,
				// 	plugin,
				// 	plugin.getInGameAchievementsProgressInfo,
				// );
				plugin.getInGameAchievementsProgressInfoByIndex(achievementIds, (info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not get achievements info', e);
				resolve(null);
			}
		});
	}

	public async getCurrentScene(): Promise<number | null> {
		return new Promise<number | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getCurrentScene((scene) => {
					resolve(scene);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse activeDeck', e);
				resolve(null);
			}
		});
	}

	public async getBoostersInfo(): Promise<BoostersInfo | null> {
		return new Promise<BoostersInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getBoostersInfo((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getBoostersInfo', e);
				resolve(null);
			}
		});
	}

	public async getActiveQuests(): Promise<MemoryQuestsLog | null> {
		return new Promise<MemoryQuestsLog | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getActiveQuests((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getActiveQuests', e);
				resolve(null);
			}
		});
	}

	public async getPlayerProfileInfo(): Promise<MemoryPlayerProfileInfo | null> {
		return new Promise<MemoryPlayerProfileInfo | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getPlayerProfileInfo((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getPlayerProfileInfo', e);
				resolve(null);
			}
		});
	}

	public async getGameUniqueId(): Promise<string | null> {
		return new Promise<string | null>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.getGameUniqueId((info) => {
					resolve(info ? JSON.parse(info) : null);
				});
			} catch (e) {
				console.warn('[mind-vision] could not parse getGameUniqueId', e);
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
				console.warn('[mind-vision] could not reset', e);
				resolve();
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
				console.warn('[mind-vision] could not tearDown', e);
				resolve();
			}
		});
	}

	public async initializePlugin() {
		return new Promise<void>(async (resolve) => {
			this.instantiatePlugin(async () => {
				const plugin = await this.get();
				if (this.globalEventListener) {
					plugin.onGlobalEvent.removeListener(this.globalEventListener);
				}
				plugin.onGlobalEvent.addListener(this.globalEventListener);

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
