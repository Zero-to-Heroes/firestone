import { EventEmitter, Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { DuelsInfo } from '../../models/duels-info';
import { GameEvent } from '../../models/game-event';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { ApiRunner } from '../api-runner';
import { isSignatureTreasure } from '../duels/duels-utils';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { DungeonLootInfoUpdatedEvent } from '../mainwindow/store/events/duels/dungeon-loot-info-updated-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { uuid } from '../utils';

const DUNGEON_LOOT_INFO_URL = 'https://e4rso1a869.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class DungeonLootParserService {
	public currentDuelsRunId: string;
	public busyRetrievingInfo: boolean;

	private lastDuelsMatch: GameStat;
	private currentDuelsHeroPowerCardDbfId: number;
	private currentDuelsSignatureTreasureCardId: string;
	private currentDuelsWins: number;
	private currentDuelsLosses: number;

	private currentReviewId: string;
	private duelsInfo: DuelsInfo;
	private currentGameType: GameType;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private rewardsTimeout;
	private shouldTryToGetRewards: boolean;

	private debug: boolean;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private memory: MemoryInspectionService,
		private allCards: AllCardsService,
		private ow: OverwolfService,
		private events: Events,
		private prefs: PreferencesService,
		private api: ApiRunner,
	) {
		// window['hophop'] = async () => {
		// 	this.debug = true;
		// 	this.retrieveLootInfo();
		// 	this.debug = false;
		// };
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.events.on(Events.GAME_STATS_UPDATED).subscribe(event => {
			const newGameStats: GameStats = event.data[0];
			this.setLastDuelsMatch(newGameStats);
		});
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.MATCH_METADATA) {
				this.duelsInfo = null;
				this.currentGameType = event.additionalData.metaData.GameType;
				this.log(
					'retrieved match meta data',
					this.currentGameType,
					[GameType.GT_PVPDR, GameType.GT_PVPDR_PAID].includes(this.currentGameType),
				);
				if ([GameType.GT_PVPDR, GameType.GT_PVPDR_PAID].includes(this.currentGameType)) {
					this.retrieveLootInfo();
				}
			} else if (event.type === GameEvent.SCENE_CHANGED) {
				const newScene = event.additionalData.scene;
				if (newScene === 'scene_pvp_dungeon_run') {
					this.shouldTryToGetRewards = true;
					this.tryAndGetRewards();
				} else {
					this.shouldTryToGetRewards = false;
					if (this.rewardsTimeout) {
						this.log('clearing rewards timeout');
						clearTimeout(this.rewardsTimeout);
						this.rewardsTimeout = null;
					}
				}
			}
		});
		this.events.on(Events.REVIEW_INITIALIZED).subscribe(async event => {
			this.log('Received new review id event', event);
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-empty-review') {
				this.currentReviewId = info.reviewId;
				this.log('set reviewId');
				// this.sendLootInfo();
			}
		});
	}

	public setLastDuelsMatch(newGameStats: GameStats) {
		if (
			(newGameStats?.stats && newGameStats.stats.length > 0 && newGameStats.stats[0].gameMode === 'duels') ||
			newGameStats.stats[0].gameMode === 'paid-duels'
		) {
			if (!this.isLastMatchInRun(newGameStats.stats[0].additionalResult, newGameStats.stats[0].result)) {
				this.log('setting last duels', newGameStats.stats[0]);
				this.lastDuelsMatch = newGameStats.stats[0];
			}
		}
	}

	private async tryAndGetRewards() {
		if (!this.shouldTryToGetRewards) {
			return;
		}
		const rewards = await this.memory.getDuelsRewardsInfo();
		this.log('reward', rewards);
		if (!rewards?.Rewards || rewards?.Rewards.length === 0) {
			this.log('no rewards yet', this.currentDuelsWins, this.currentDuelsLosses);
			if (this.rewardsTimeout) {
				clearTimeout(this.rewardsTimeout);
				this.rewardsTimeout = null;
			}
			this.rewardsTimeout = setTimeout(() => this.tryAndGetRewards(), 1000);
			return;
		}

		this.currentDuelsRunId = this.currentDuelsRunId || (await this.prefs.getPreferences()).duelsRunUuid;
		this.duelsInfo = this.duelsInfo || (await this.memory.getDuelsInfo(false, 5)) || ({} as any);

		if (!this.currentDuelsRunId) {
			this.log('not enough info to link an Arena Reward');
			return;
		}

		this.updateCurrentDuelsInfo(this.duelsInfo);

		const user = await this.ow.getCurrentUser();
		const input: Input = {
			type: this.currentGameType === GameType.GT_PVPDR ? 'duels' : 'paid-duels',
			reviewId: this.currentReviewId,
			runId: this.currentDuelsRunId,
			userId: user.userId,
			userName: user.username,
			rewards: rewards,
			currentWins: this.duelsInfo.Wins,
			currentLosses: this.duelsInfo.Losses,
			rating: this.currentGameType === GameType.GT_PVPDR ? this.duelsInfo.Rating : this.duelsInfo.PaidRating,
			appVersion: process.env.APP_VERSION,
		} as Input;
		this.log('sending rewards info', input);
		this.api.callPostApiWithRetries(DUNGEON_LOOT_INFO_URL, input);
		this.stateUpdater.next(new DungeonLootInfoUpdatedEvent(input));
	}

	private async retrieveLootInfo() {
		this.busyRetrievingInfo = true;
		this.duelsInfo = await this.memory.getDuelsInfo(false, 5);
		this.log('retrieved duels info', this.duelsInfo, this.currentGameType);
		// Should already have picked something, but nothing is detected
		if (
			!this.duelsInfo ||
			((this.duelsInfo.Wins > 0 || this.duelsInfo.Losses > 0) &&
				!this.duelsInfo.LootOptionBundles?.length &&
				!this.duelsInfo.TreasureOption?.length)
		) {
			this.duelsInfo = await this.memory.getDuelsInfo(true);
			this.log('retrieved duels info after force reset', this.duelsInfo);
		}

		if (!this.duelsInfo) {
			console.error('Could not retrieve duels info', this.currentDuelsRunId);
		}

		if (this.isNewRun(this.duelsInfo)) {
			// Start a new run
			this.log('starting a new run', this.duelsInfo);
			await this.prefs.setDuelsRunId(uuid());
		}
		this.log('getting currentDuelsRunId');
		this.currentDuelsRunId = (await this.prefs.getPreferences()).duelsRunUuid;
		this.log('set currentDuelsRunId', this.currentDuelsRunId);
		if (!this.currentDuelsRunId) {
			await this.prefs.setDuelsRunId(uuid());
			this.currentDuelsRunId = (await this.prefs.getPreferences()).duelsRunUuid;
			this.log('Could not retrieve duels run id, starting a new run', this.currentDuelsRunId);
		}
		this.busyRetrievingInfo = false;
		this.sendLootInfo();
	}

	private isNewRun(duelsInfo: DuelsInfo): boolean {
		if (!duelsInfo) {
			return false;
		}
		if (duelsInfo?.Wins === 0 && duelsInfo?.Losses === 0) {
			this.log('wins and losses are 0, starting new run', duelsInfo);
			return true;
		}

		// TODO: look up the last match with this run info, and compare the wins to that
		if (
			(this.currentDuelsWins != null && duelsInfo.Wins < this.currentDuelsWins) ||
			(this.currentDuelsLosses != null && duelsInfo.Losses < this.currentDuelsLosses)
		) {
			this.log(
				'wins or losses less than previous info, starting new run',
				duelsInfo,
				this.currentDuelsWins,
				this.currentDuelsLosses,
			);
			return true;
		}

		if (this.lastDuelsMatch) {
			const [wins, losses] = this.lastDuelsMatch.additionalResult.split('-').map(info => parseInt(info));
			if (duelsInfo.Wins < wins || duelsInfo.Losses < losses) {
				this.log(
					'wins or losses less than previous info, starting new run',
					duelsInfo,
					this.lastDuelsMatch.additionalResult,
					this.lastDuelsMatch,
				);
				return true;
			}
			if (this.duelsInfo.HeroCardId !== this.lastDuelsMatch.playerCardId) {
				this.log(
					'different card id, starting new run',
					this.duelsInfo.HeroCardId,
					this.lastDuelsMatch.playerCardId,
					duelsInfo,
					this.lastDuelsMatch,
				);
				return true;
			}
		}

		if (
			this.currentDuelsHeroPowerCardDbfId &&
			duelsInfo.StartingHeroPower !== this.currentDuelsHeroPowerCardDbfId
		) {
			this.log('different hero power, starting new run', duelsInfo, this.currentDuelsHeroPowerCardDbfId);
			return true;
		}
		if (duelsInfo.LastRatingChange > 0) {
			this.log('rating changed, starting new run', duelsInfo.LastRatingChange);
			return true;
		}
		const signatureTreasure: string = this.findSignatureTreasure(duelsInfo.DeckList);
		if (
			this.currentDuelsSignatureTreasureCardId &&
			signatureTreasure !== this.currentDuelsSignatureTreasureCardId
		) {
			this.log(
				'different signature treasure, starting new run',
				duelsInfo,
				this.currentDuelsSignatureTreasureCardId,
			);
		}
	}

	private async sendLootInfo() {
		if (
			!this.currentReviewId ||
			!this.duelsInfo ||
			![GameType.GT_PVPDR, GameType.GT_PVPDR_PAID].includes(this.currentGameType)
		) {
			this.log('not enough data, not sending loot info', this.duelsInfo, this.currentGameType);
			return;
		}

		if (this.duelsInfo?.Wins === 0 && this.duelsInfo?.Losses === 0) {
			this.log('not sending info in the first game, as data might be from the previous run');
			return;
		}

		this.updateCurrentDuelsInfo(this.duelsInfo);

		const user = await this.ow.getCurrentUser();
		const treasures: readonly string[] = this.duelsInfo.TreasureOption
			? this.duelsInfo.TreasureOption.map(option => this.allCards.getCardFromDbfId(+option)?.id || '' + option)
			: [];
		const signatureTreasure: string = this.findSignatureTreasure(this.duelsInfo.DeckList);
		const input: Input = {
			type: this.currentGameType === GameType.GT_PVPDR ? 'duels' : 'paid-duels',
			reviewId: this.currentReviewId,
			runId: this.currentDuelsRunId,
			userId: user.userId,
			userName: user.username,
			startingHeroPower:
				this.allCards.getCardFromDbfId(+this.duelsInfo.StartingHeroPower)?.id ||
				'' + this.duelsInfo.StartingHeroPower,
			signatureTreasure: signatureTreasure,
			lootBundles: this.duelsInfo.LootOptionBundles
				? this.duelsInfo.LootOptionBundles.filter(bundle => bundle).map(bundle => ({
						bundleId: this.allCards.getCardFromDbfId(+bundle.BundleId)?.id || '' + bundle.BundleId,
						elements: bundle.Elements.map(
							dbfId => this.allCards.getCardFromDbfId(+dbfId)?.id || '' + dbfId,
						),
				  }))
				: [],
			chosenLootIndex: this.duelsInfo.ChosenLoot,
			treasureOptions: treasures,
			chosenTreasureIndex: this.duelsInfo.ChosenTreasure,
			rewards: null,
			currentWins: this.duelsInfo.Wins,
			currentLosses: this.duelsInfo.Losses,
			rating: this.currentGameType === GameType.GT_PVPDR ? this.duelsInfo.Rating : this.duelsInfo.PaidRating,
			appVersion: process.env.APP_VERSION,
		};
		this.log('sending loot into', input);
		this.api.callPostApiWithRetries(DUNGEON_LOOT_INFO_URL, input);
		this.stateUpdater.next(new DungeonLootInfoUpdatedEvent(input));
	}

	private updateCurrentDuelsInfo(duelsInfo: DuelsInfo) {
		this.currentDuelsHeroPowerCardDbfId = duelsInfo.StartingHeroPower;
		this.currentDuelsSignatureTreasureCardId = this.findSignatureTreasure(duelsInfo.DeckList || []);
		this.currentDuelsWins = duelsInfo.Wins;
		this.currentDuelsLosses = duelsInfo.Losses;
	}

	private findSignatureTreasure(deckList: readonly number[]): string {
		return deckList
			.map(cardDbfId => this.allCards.getCardFromDbfId(+cardDbfId))
			.find(card => isSignatureTreasure(card?.id, this.allCards))?.id;
	}

	private isLastMatchInRun(additionalResult: string, result: 'won' | 'lost' | 'tied'): boolean {
		if (!additionalResult) {
			return false;
		}
		const [wins, losses] = additionalResult.split('-').map(info => parseInt(info));
		if (wins === 11 && result === 'won') {
			this.log('last duels match was the last of the run, not forwarding run id', additionalResult, result);
			return true;
		}
		if (losses === 2 && result === 'lost') {
			return false;
		}
	}

	private log(...args) {
		console.log('[dungeon-loot-parser]', this.currentReviewId, this.currentDuelsRunId, ...args);
	}
}
