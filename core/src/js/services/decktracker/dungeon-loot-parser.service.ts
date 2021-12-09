import { EventEmitter, Injectable } from '@angular/core';
import { CardClass, GameType } from '@firestone-hs/reference-data';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { CardsFacadeService } from '@services/cards-facade.service';
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
	private readonly goingIntoQueueRegex = new RegExp('D \\d*:\\d*:\\d*.\\d* BeginEffect blur \\d => 1');

	public currentDuelsRunId: string;
	public busyRetrievingInfo: boolean;
	public currentDuelsWins: number;
	public currentDuelsLosses: number;
	public currentDuelsRating: number;
	public currentDuelsPaidRating: number;

	private spectating: boolean;
	private lastDuelsMatch: GameStat;
	private currentDuelsHeroPowerCardDbfId: number;
	private currentDuelsSignatureTreasureCardId: string;

	private currentReviewId: string;
	private duelsInfo: DuelsInfo;
	private currentGameType: GameType;
	private rewardsInput: Input;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private rewardsTimeout;
	// private shouldTryToGetRewards: boolean;

	private debug: boolean;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private memory: MemoryInspectionService,
		private allCards: CardsFacadeService,
		private ow: OverwolfService,
		private events: Events,
		private prefs: PreferencesService,
		private api: ApiRunner,
	) {
		this.events.on(Events.GAME_STATS_UPDATED).subscribe((event) => {
			const newGameStats: GameStats = event.data[0];
			this.setLastDuelsMatch(newGameStats?.stats);
		});
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.MATCH_METADATA && !event.additionalData.spectating && !this.spectating) {
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
			} else if (event.type === GameEvent.SPECTATING) {
				this.spectating = event.additionalData.spectating;
			}
		});
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				// this.shouldTryToGetRewards = false;
				if (this.rewardsTimeout) {
					this.log('clearing rewards timeout');
					clearTimeout(this.rewardsTimeout);
					this.rewardsTimeout = null;
				}
			}
		});
		this.events.on(Events.REVIEW_INITIALIZED).subscribe(async (event) => {
			this.log('Received new review id event', event);
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-empty-review') {
				this.currentReviewId = info.reviewId;
				this.log('set reviewId');
				// this.sendLootInfo();
			}
		});
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public setLastDuelsMatch(stats: readonly GameStat[]) {
		this.log('trying to set last duels match', stats?.length && stats[0]);
		if (!stats?.length) {
			return;
		}

		if (stats[0].gameMode === 'duels' || stats[0].gameMode === 'paid-duels') {
			this.log(
				'correct game mode, trying to see if it is the last match in run',
				stats[0].additionalResult,
				stats[0].result,
			);
			if (this.isMatchInRun(stats[0].additionalResult, stats[0].result)) {
				this.log('setting last duels', stats[0]);
				this.lastDuelsMatch = stats[0];
				this.currentDuelsRunId = this.lastDuelsMatch.runId;
				this.log('set currentDuelsRunId', this.currentDuelsRunId);
			} else {
				this.log('last match is not in run, resetting last duels run info');
				this.reset();
			}
		}
	}

	public async handleBlur(logLine: string) {
		if (this.spectating) {
			this.log('spectating, not handling blur');
			return;
		}
		// this.logDebug('handling blur', logLine);
		if (!this.goingIntoQueueRegex.exec(logLine)) {
			return;
		}

		// this.logDebug('blurring');
		const currentScene = await this.memory.getCurrentSceneFromMindVision();
		// this.logDebug('got current scene', currentScene);
		// PVPDR
		if (currentScene !== 18) {
			return;
		}

		if (!this.currentDuelsRunId) {
			this.log('not enough info to link an Arena Reward');
			return;
		}

		const isMaybeOnRewardsScreen = await this.memory.isMaybeOnDuelsRewardsScreen();
		// this.logDebug('isMaybeOnRewardsScreen', isMaybeOnRewardsScreen);
		if (!isMaybeOnRewardsScreen) {
			return;
		}

		this.log('trying to get rewards');
		const rewards = await this.memory.getDuelsRewardsInfo(true);
		this.log('reward', rewards);
		if (!rewards?.Rewards || rewards?.Rewards.length === 0) {
			this.log('no rewards, missed the timing', this.currentDuelsWins, this.currentDuelsLosses);
			return;
		}

		// Don't do it before the rewards, otherwise it might bring a heavy toll on the CPU
		this.duelsInfo = this.duelsInfo || (await this.memory.getDuelsInfo(false, 5)) || ({} as any);
		this.updateCurrentDuelsInfo(this.duelsInfo);

		const user = await this.ow.getCurrentUser();

		// Put it later, so that we do the check at the last possible moment
		if (this.rewardsInput?.runId === this.currentDuelsRunId) {
			this.log('already sent rewards for run', this.rewardsInput);
			return;
		}

		this.rewardsInput = {
			type: this.currentGameType === GameType.GT_PVPDR ? 'duels' : 'paid-duels',
			reviewId: this.currentReviewId,
			runId: this.currentDuelsRunId,
			userId: user.userId,
			userName: user.username,
			rewards: rewards,
			currentWins: this.duelsInfo.Wins,
			currentLosses: this.duelsInfo.Losses,
			rating: this.currentGameType === GameType.GT_PVPDR ? this.duelsInfo?.Rating : this.duelsInfo?.PaidRating,
			appVersion: process.env.APP_VERSION,
		} as Input;
		this.log('sending rewards info', this.rewardsInput);
		this.api.callPostApi(DUNGEON_LOOT_INFO_URL, this.rewardsInput);
		this.stateUpdater.next(new DungeonLootInfoUpdatedEvent(this.rewardsInput));
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
			return;
		}

		if (this.isNewRun(this.duelsInfo)) {
			// Start a new run
			this.currentDuelsRunId = uuid();
			this.reset();
			this.log('starting a new run', this.duelsInfo);
		}
		if (!this.currentDuelsRunId) {
			this.currentDuelsRunId = uuid();
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
			if (
				// In case of ties for the first match, we don't want to start a new run
				this.lastDuelsMatch?.result === 'tied' &&
				this.currentDuelsWins === 0 &&
				this.currentDuelsLosses === 0
			) {
				this.log('had a tie on the first round, not starting a new run');
			} else {
				this.log('wins and losses are 0, starting new run', duelsInfo);
				return true;
			}
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

		if (this.lastDuelsMatch?.additionalResult) {
			const [wins, losses] = this.lastDuelsMatch.additionalResult.split('-').map((info) => parseInt(info));
			if (duelsInfo.Wins < wins || duelsInfo.Losses < losses) {
				this.log(
					'wins or losses less than previous info, starting new run',
					duelsInfo,
					this.lastDuelsMatch.additionalResult,
					this.lastDuelsMatch,
				);
				return true;
			}
			if (
				!this.lastDuelsMatch.playerClass ||
				CardClass[this.duelsInfo.PlayerClass]?.toLowerCase() !== this.lastDuelsMatch.playerClass.toLowerCase()
			) {
				this.log(
					'different player class, starting new run',
					this.duelsInfo.PlayerClass,
					CardClass[this.duelsInfo.PlayerClass],
					this.lastDuelsMatch.playerCardId,
					this.lastDuelsMatch.playerClass,
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
			this.currentDuelsLosses = 0;
			this.currentDuelsWins = 0;
			this.currentDuelsRating = undefined;
			this.currentDuelsPaidRating = undefined;
			this.currentDuelsHeroPowerCardDbfId = undefined;
			this.currentDuelsSignatureTreasureCardId = undefined;
			return;
		}

		// No need to set it first, as it might contain some outdated info from the previous run
		this.updateCurrentDuelsInfo(this.duelsInfo);

		const user = await this.ow.getCurrentUser();
		const treasures: readonly string[] = this.duelsInfo.TreasureOption
			? this.duelsInfo.TreasureOption.map((option) => this.allCards.getCardFromDbfId(+option)?.id || '' + option)
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
				? this.duelsInfo.LootOptionBundles.filter((bundle) => bundle).map((bundle) => ({
						bundleId: this.allCards.getCardFromDbfId(+bundle.BundleId)?.id || '' + bundle.BundleId,
						elements: bundle.Elements.map(
							(dbfId) => this.allCards.getCardFromDbfId(+dbfId)?.id || '' + dbfId,
						),
				  }))
				: [],
			chosenLootIndex: this.duelsInfo.ChosenLoot,
			treasureOptions: treasures,
			chosenTreasureIndex: this.duelsInfo.ChosenTreasure,
			rewards: null,
			currentWins: this.duelsInfo.Wins,
			currentLosses: this.duelsInfo.Losses,
			rating: this.currentGameType === GameType.GT_PVPDR ? this.duelsInfo?.Rating : this.duelsInfo?.PaidRating,
			appVersion: process.env.APP_VERSION,
		};
		this.log('sending loot into', input);
		this.api.callPostApi(DUNGEON_LOOT_INFO_URL, input);
		this.stateUpdater.next(new DungeonLootInfoUpdatedEvent(input));
	}

	private updateCurrentDuelsInfo(duelsInfo: DuelsInfo) {
		this.currentDuelsHeroPowerCardDbfId = duelsInfo.StartingHeroPower;
		this.currentDuelsSignatureTreasureCardId = this.findSignatureTreasure(duelsInfo.DeckList || []);
		this.currentDuelsWins = duelsInfo.Wins;
		this.currentDuelsLosses = duelsInfo.Losses;
		this.currentDuelsRating = duelsInfo.Rating;
		this.currentDuelsPaidRating = duelsInfo.PaidRating;
		this.log(
			'updated current duels info',
			this.currentDuelsWins,
			this.currentDuelsLosses,
			this.currentDuelsHeroPowerCardDbfId,
			this.currentDuelsSignatureTreasureCardId,
		);
	}

	private findSignatureTreasure(deckList: readonly number[]): string {
		return deckList
			.map((cardDbfId) => this.allCards.getCardFromDbfId(+cardDbfId))
			.find((card) => isSignatureTreasure(card?.id, this.allCards))?.id;
	}

	private isMatchInRun(additionalResult: string, result: 'won' | 'lost' | 'tied'): boolean {
		if (!additionalResult) {
			this.log('isLastMatchInRun', 'no additional result', additionalResult, result);
			return false;
		}

		const [wins, losses] = additionalResult.split('-').map((info) => parseInt(info));
		this.log('isLastMatchInRun', 'wins, losses', wins, losses);
		if (wins === 11 && result === 'won') {
			this.log('last duels match was the last win of the run, not forwarding run id', additionalResult, result);
			return false;
		}
		if (losses === 2 && result === 'lost') {
			this.log('last duels match was the last loss of the run, not forwarding run id', additionalResult, result);
			return false;
		}
		return true;
	}

	private reset() {
		this.currentDuelsWins = 0;
		this.currentDuelsLosses = 0;
		this.lastDuelsMatch = undefined;
		this.currentDuelsHeroPowerCardDbfId = undefined;
		this.currentDuelsSignatureTreasureCardId = undefined;
	}

	private logDebug(...args) {
		console.debug('[dungeon-loot-parser]', this.currentReviewId, this.currentDuelsRunId, ...args);
	}

	private log(...args) {
		console.log('[dungeon-loot-parser]', this.currentReviewId, this.currentDuelsRunId, ...args);
	}
}
