import { Injectable } from '@angular/core';
import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { ArenaInfo } from '../../../models/arena-info';
import { BoostersInfo } from '../../../models/memory/boosters-info';
import { CoinInfo } from '../../../models/memory/coin-info';
import { MemoryMercenariesCollectionInfo } from '../../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../../models/memory/memory-mercenaries-info';
import { MemoryUpdate } from '../../../models/memory/memory-update';
import { RewardsTrackInfo } from '../../../models/rewards-track-info';
import { Events } from '../../events.service';
import { OwNotificationsService } from '../../notifications.service';
import { OverwolfService } from '../../overwolf.service';
import { InternalHsAchievementsInfo } from './get-achievements-info-operation';

declare let OverwolfPlugin: any;

@Injectable()
export class MindVisionService {
	private static readonly MAX_RETRIES_FOR_MEMORY_LISTENING = 3;

	// Use two different instances so that the reset of the main plugin doesn't impact
	// the listener
	private mindVisionPlugin: any;
	// private mindVisionListenerPlugin: any;

	initialized = false;
	initializing = false;
	// initializedListener = false;
	memoryUpdateListener;

	constructor(
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly notifs: OwNotificationsService,
	) {
		this.init();
	}

	private async init() {
		const inGame = await this.ow.inGame();
		if (inGame) {
			this.initialize();
		} else {
			console.log('[mind-vision] not in game, not starting memory poll or memory reading plugin');
		}
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				if (this.memoryUpdateListener) {
					console.log('[mind-vision] leaving game, stopping memory poll', res);
					const plugin = await this.get();
					plugin.onMemoryUpdate.removeListener(this.memoryUpdateListener);
					await this.stopListening();
					this.memoryUpdateListener = null;
					this.initialized = false;
					this.initializing = false;
				}
				await this.reset();
			} else if ((await this.ow.inGame()) && res.gameChanged) {
				if (!this.memoryUpdateListener) {
					console.log(
						'[mind-vision] starting game, starting memory poll',
						this.initialized,
						this.initializing,
					);
					this.initialize();
				}
			}
		});
	}

	private retriesLeft = MindVisionService.MAX_RETRIES_FOR_MEMORY_LISTENING;

	private async listenForUpdates() {
		const plugin = await this.get();
		try {
			console.log('[mind-vision] getting ready to listen for updates', this.memoryUpdateListener == null);
			if (this.memoryUpdateListener) {
				plugin.onMemoryUpdate.removeListener(this.memoryUpdateListener);
			}

			console.log('[mind-vision] adding updates listener');
			this.memoryUpdateListener = async (changes: string | 'reset') => {
				console.log('[mind-vision] memory update', changes);
				const changesToBroadcast: MemoryUpdate | 'reset' = JSON.parse(changes);
				// Happens when the plugin is reset, we need to resubscribe
				if (changesToBroadcast === 'reset' || changesToBroadcast.ShouldReset) {
					console.log('[mind-vision] resetting memory update?', this.retriesLeft);
					if (this.retriesLeft >= 0) {
						this.retriesLeft--;
						plugin.onMemoryUpdate.removeListener(this.memoryUpdateListener);
						this.memoryUpdateListener = null;
						await this.resetListening();
						await this.listenForUpdates();
					} else {
						console.error('[mind-vision] stopping after 5 resets');
					}
					return;
				}
				this.retriesLeft = MindVisionService.MAX_RETRIES_FOR_MEMORY_LISTENING;
				this.events.broadcast(Events.MEMORY_UPDATE, changesToBroadcast);
			};
			plugin.onMemoryUpdate.addListener(this.memoryUpdateListener);
			plugin.listenForUpdates((result) => {
				console.log('[mind-vision] listenForUpdates callback result: ', result);
			});
		} catch (e) {
			console.error('[mind-vision] could not listenForUpdates', e);
		}
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

	public async getActiveDeck(selectedDeckId: number, forceReset: boolean): Promise<any> {
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

	public async isMaybeOnDuelsRewardsScreen(): Promise<boolean> {
		return new Promise<boolean>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.isMaybeOnDuelsRewardsScreen((result) => {
					resolve(result);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse isMaybeOnDuelsRewardsScreen', e);
				resolve(null);
			}
		});
	}

	// Here we reset both plugins because this method is used only once, after
	// initialization, to be sure we refresh the plugins once the memory is
	// properly populated
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

	public async resetListening(): Promise<void> {
		console.log('[mind-vision] calling resetListening');
		return new Promise<void>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.resetListening((result) => {
					console.log('[mind-vision] resetListening done');
					resolve();
				});
			} catch (e) {
				console.log('[mind-vision] could not resetListening', e);
				resolve(null);
			}
		});
	}

	public async stopListening(): Promise<void> {
		console.log('[mind-vision] calling stopListening');
		return new Promise<void>(async (resolve) => {
			const plugin = await this.get();
			try {
				plugin.stopListening((result) => {
					console.log('[mind-vision] stopListening done');
					resolve();
				});
			} catch (e) {
				console.log('[mind-vision] could not stopListening', e);
				resolve(null);
			}
		});
	}

	private async get() {
		await this.waitForInit();
		return this.mindVisionPlugin.get();
	}

	private async initialize() {
		if (this.initialized || this.initializing) {
			console.log('[mind-vision] already initialized, returning', this.initialized, this.initializing);
			return;
		}

		this.initialized = false;
		this.initializing = true;
		try {
			console.log('[mind-vision] plugin init starting', this.mindVisionPlugin);
			this.mindVisionPlugin = new OverwolfPlugin('mind-vision', true);
			this.mindVisionPlugin.initialize(async (status: boolean) => {
				if (status === false) {
					console.error("[mind-vision] Plugin couldn't be loaded??", 'retrying');
					this.initializing = false;
					setTimeout(() => this.initialize(), 2000);
					return;
				}
				console.log('[mind-vision] Plugin ' + this.mindVisionPlugin.get()._PluginName_ + ' was loaded!');

				this.listenForUpdates();
				this.initialized = true;
				this.initializing = false;
			});
			const plugin = await this.get();
			plugin.onGlobalEvent.addListener((first: string, second: string) => {
				console.log('[mind-vision] received global event', first, second);
				if (first === 'mindvision-instantiate-error') {
					this.notifyError(
						'Memory reading error',
						'Some features will be unavailable. Please run Firestone/Overwolf as admin or contact us on Discord',
						first,
					);
				}
			});
		} catch (e) {
			console.warn('[mind-vision]Could not load plugin, retrying', e);
			this.initializing = false;
			this.initialized = false;
			setTimeout(() => this.initialize(), 2000);
		}
	}

	private notifyError(title: string, text: string, code: string) {
		this.notifs.emitNewNotification({
			content: `
				<div class="general-message-container general-theme">
					<div class="firestone-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
						</svg>
					</div>
					<div class="message">
						<div class="title">
							<span>${title}</span>
						</div>
						<span class="text">${text}</span>
					</div>
					<button class="i-30 close-button">
						<svg class="svg-icon-fill">
							<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
						</svg>
					</button>
				</div>`,
			notificationId: `${code}`,
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
