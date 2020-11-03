import { Injectable } from '@angular/core';
import { CardIds, GameType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { DuelsInfo } from '../../models/duels-info';
import { GameEvent } from '../../models/game-event';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { DungeonLootInfoUpdatedEvent } from '../mainwindow/store/events/duels/dungeon-loot-info-updated-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { uuid } from '../utils';

const DUNGEON_LOOT_INFO_URL = 'https://e4rso1a869.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class DungeonLootParserService {
	private readonly goingIntoQueueRegex = new RegExp('D \\d*:\\d*:\\d*.\\d* BeginEffect blur \\d => 1');
	private readonly SIGNATURE_TREASUERS = [
		CardIds.NonCollectible.Demonhunter.SummoningRitual2,
		CardIds.NonCollectible.Druid.WardensInsight,
		CardIds.NonCollectible.Hunter.SlatesSyringe,
		CardIds.NonCollectible.Mage.WandOfDueling,
		CardIds.NonCollectible.Paladin.RoyalGreatsword,
		CardIds.NonCollectible.Priest.FracturedSpirits,
		CardIds.NonCollectible.Rogue.DeadlyWeapons101,
		CardIds.NonCollectible.Shaman.FluctuatingTotem,
		CardIds.NonCollectible.Warlock.ImpishAid,
		CardIds.NonCollectible.Warrior.AutoArmaments,
	];

	public currentDuelsRunId: string;
	private currentDuelsHeroPowerCardDbfId: number;
	private currentDuelsSignatureTreasureCardId: string;
	private currentDuelsWins: number;
	private currentDuelsLosses: number;

	private currentReviewId: string;
	private duelsInfo: DuelsInfo;
	private currentGameType: GameType;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private memory: MemoryInspectionService,
		private allCards: AllCardsService,
		private ow: OverwolfService,
		private events: Events,
		private prefs: PreferencesService,
		private api: ApiRunner,
		private store: MainWindowStoreService,
	) {
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.GAME_END) {
				this.duelsInfo = null;
				this.currentReviewId = null;
				this.currentGameType = null;
			} else if (event.type === GameEvent.MATCH_METADATA) {
				this.currentGameType = event.additionalData.metaData.GameType;
				this.sendLootInfo();
			}
		});
		this.events.on(Events.REVIEW_INITIALIZED).subscribe(async event => {
			console.log('[dungeon-loot-parser] Received new review id event');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-empty-review') {
				this.currentReviewId = info.reviewId;
				this.sendLootInfo();
			}
		});
	}

	public async queueingIntoMatch(logLine: string) {
		if (this.goingIntoQueueRegex.exec(logLine)) {
			const currentScene = await this.memory.getCurrentScene();
			// Don't refresh the deck when leaving the match
			if (currentScene !== 'unknown_18') {
				return;
			}

			this.duelsInfo = await this.memory.getDuelsInfo(false, 10);
			console.log('[dungeon-loot-parser] retrieved duels info', this.duelsInfo);
			// Should already have picked something, but nothing is detected
			if (
				!this.duelsInfo ||
				((this.duelsInfo.Wins > 0 || this.duelsInfo.Losses > 0) &&
					!this.duelsInfo.LootOptionBundles?.length &&
					!this.duelsInfo.TreasureOption?.length)
			) {
				this.duelsInfo = await this.memory.getDuelsInfo(true);
				console.log('[dungeon-loot-parser] retrieved duels info after force reset', this.duelsInfo);
			}

			if (!this.duelsInfo) {
				console.error('[dungeon-loot-parser] Could not retrieve duels info', this.currentDuelsRunId);
			}

			if (this.isNewRun(this.duelsInfo)) {
				// Start a new run
				console.log('[dungeon-loot-parser] starting a new run', this.duelsInfo);
				await this.prefs.setDuelsRunId(uuid());
			}
			this.currentDuelsRunId = (await this.prefs.getPreferences()).duelsRunUuid;
			console.log('[dungeon-loot-parser] set currentDuelsRunId', this.currentDuelsRunId);
			if (!this.currentDuelsRunId) {
				await this.prefs.setDuelsRunId(uuid());
				this.currentDuelsRunId = (await this.prefs.getPreferences()).duelsRunUuid;
				console.log(
					'[dungeon-loot-parser] Could not retrieve duels run id, starting a new run',
					this.currentDuelsRunId,
				);
			}
			this.sendLootInfo();
		}
	}

	public resetDuelsRunId() {
		console.log('[dungeon-loot-parser] resetting DuelsDunId');
		this.prefs.setDuelsRunId(null);
		this.currentDuelsRunId = null;
		this.currentDuelsHeroPowerCardDbfId = null;
		this.currentDuelsSignatureTreasureCardId = null;
		this.currentDuelsWins = null;
		this.currentDuelsLosses = null;
	}

	private isNewRun(duelsInfo: DuelsInfo): boolean {
		if (duelsInfo?.Wins === 0 && duelsInfo?.Losses === 0) {
			console.log('[dungeon-loot-parser] wins and losses are 0, starting new run', duelsInfo);
			return true;
		}
		if (
			(this.currentDuelsWins != null && duelsInfo.Wins < this.currentDuelsWins) ||
			(this.currentDuelsLosses != null && duelsInfo.Losses < this.currentDuelsLosses)
		) {
			console.log(
				'[dungeon-loot-parser] wins or losses less than previous info, starting new run',
				duelsInfo,
				this.currentDuelsWins,
				this.currentDuelsLosses,
			);
			return true;
		}
		if (
			this.currentDuelsHeroPowerCardDbfId &&
			duelsInfo.StartingHeroPower !== this.currentDuelsHeroPowerCardDbfId
		) {
			console.log(
				'[dungeon-loot-parser] different hero power, starting new run',
				duelsInfo,
				this.currentDuelsHeroPowerCardDbfId,
			);
			return true;
		}
		if (duelsInfo.LastRatingChange > 0) {
			console.log('[dungeon-loot-parser] rating changed, starting new run', duelsInfo.LastRatingChange);
			return true;
		}
		const signatureTreasure: string = this.findSignatureTreasure(duelsInfo.DeckList);
		if (
			this.currentDuelsSignatureTreasureCardId &&
			signatureTreasure !== this.currentDuelsSignatureTreasureCardId
		) {
			console.log(
				'[dungeon-loot-parser] different signature treasure, starting new run',
				duelsInfo,
				this.currentDuelsSignatureTreasureCardId,
			);
		}
	}

	private async sendLootInfo() {
		if (!this.currentReviewId || !this.duelsInfo || !this.currentGameType) {
			console.log(
				'[dungeon-loot-parser] not enough data, not sending loot info',
				this.currentReviewId,
				this.duelsInfo,
				this.currentDuelsRunId,
				this.currentGameType,
			);
			return;
		}

		if (this.duelsInfo?.Wins === 0 && this.duelsInfo?.Losses === 0) {
			console.log(
				'[dungeon-loot-parser] not sending info in the first game, as data might be from the previous run',
			);
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
			currentWins: this.duelsInfo.Wins,
			currentLosses: this.duelsInfo.Losses,
			rating: this.currentGameType === GameType.GT_PVPDR ? this.duelsInfo.Rating : this.duelsInfo.PaidRating,
			appVersion: process.env.APP_VERSION,
		};
		console.log('[dungeon-loot-parser] sending loot into', input);
		this.api.callPostApiWithRetries(DUNGEON_LOOT_INFO_URL, input);
		this.store.stateUpdater.next(new DungeonLootInfoUpdatedEvent(input));
	}

	private updateCurrentDuelsInfo(duelsInfo: DuelsInfo) {
		this.currentDuelsHeroPowerCardDbfId = duelsInfo.StartingHeroPower;
		this.currentDuelsSignatureTreasureCardId = this.findSignatureTreasure(duelsInfo.DeckList);
		this.currentDuelsWins = duelsInfo.Wins;
		this.currentDuelsLosses = duelsInfo.Losses;
	}

	private findSignatureTreasure(deckList: readonly number[]): string {
		return deckList
			.map(cardDbfId => this.allCards.getCardFromDbfId(+cardDbfId))
			.find(card => this.SIGNATURE_TREASUERS.includes(card?.id))?.id;
	}
}
