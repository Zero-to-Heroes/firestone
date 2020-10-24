import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { DuelsInfo } from '../../models/duels-info';
import { GameEvent } from '../../models/game-event';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
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

	private currentReviewId: string;
	private duelsInfo: DuelsInfo;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private memory: MemoryInspectionService,
		private allCards: AllCardsService,
		private ow: OverwolfService,
		private events: Events,
		private prefs: PreferencesService,
		private api: ApiRunner,
	) {
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.GAME_END) {
				this.duelsInfo = null;
				this.currentReviewId = null;
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
		// window['hop'] = async () => {
		// 	let duelsInfo = await this.memory.getDuelsInfo();
		// 	console.log('duelsInfo', duelsInfo);
		// 	duelsInfo = await this.memory.getDuelsInfo(true);
		// 	console.log('[dungeon-loot-parser] retrieved duels info after force reset', duelsInfo);
		// 	const treasures: readonly string[] = duelsInfo.TreasureOption
		// 		? duelsInfo.TreasureOption.map(option => this.allCards.getCardFromDbfId(option)?.id || '' + option)
		// 		: [];
		// 	const input: Input = {
		// 		// TODO: have "paid-duels" be an option as well
		// 		type: 'duels',
		// 		reviewId: this.currentReviewId,
		// 		runId: this.currentDuelsRunId,
		// 		lootBundles: duelsInfo.LootOptionBundles
		// 			? duelsInfo.LootOptionBundles.map(bundle => ({
		// 					bundleId: this.allCards.getCardFromDbfId(bundle.BundleId)?.id || '' + bundle.BundleId,
		// 					elements: bundle.Elements.map(
		// 						dbfId => this.allCards.getCardFromDbfId(dbfId)?.id || '' + dbfId,
		// 					),
		// 			  }))
		// 			: [],
		// 		chosenLootIndex: duelsInfo.ChosenLoot,
		// 		treasureOptions: treasures,
		// 		chosenTreasureIndex: duelsInfo.ChosenTreasure,
		// 		currentWins: duelsInfo.Wins,
		// 		currentLosses: duelsInfo.Losses,
		// 		// TODO: send paid / normal rating depending on game mode
		// 		rating: duelsInfo.Rating,
		// 	};
		// 	console.log('[dungeon-loot-parser] sending loot into', input);
		// 	this.api.callPostApiWithRetries(DUNGEON_LOOT_INFO_URL, input);
		// };
	}

	public async queueingIntoMatch(logLine: string) {
		if (this.goingIntoQueueRegex.exec(logLine)) {
			const currentScene = await this.memory.getCurrentScene();
			// Don't refresh the deck when leaving the match
			if (currentScene !== 'unknown_18') {
				return;
			}

			this.duelsInfo = await this.memory.getDuelsInfo(false, 5);
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

			if (this.duelsInfo?.Wins === 0 && this.duelsInfo?.Losses === 0) {
				// Start a new run
				console.log('[dungeon-loot-parser] starting a new run', this.duelsInfo);
				// TODO: also handle paid Duels
				await this.prefs.setDuelsRunId(uuid());
			}
			this.currentDuelsRunId = (await this.prefs.getPreferences()).duelsRunUuid;
			if (!this.currentDuelsRunId) {
				await this.prefs.setDuelsRunId(uuid());
				this.currentDuelsRunId = (await this.prefs.getPreferences()).duelsRunUuid;
				console.log('Could not retrieve duels run id, starting a new run', this.currentDuelsRunId);
			}
			this.sendLootInfo();
		}
	}

	private async sendLootInfo() {
		if (!this.currentReviewId || !this.duelsInfo) {
			console.log(
				'[dungeon-loot-parser] not enough data, not sending loot info',
				this.currentReviewId,
				this.duelsInfo,
				this.currentDuelsRunId,
			);
			return;
		}
		// TODO: this will let me associate a review id (and then later on, a win / loss or a final win/loss)
		// TODO: how to group individual games into a "run"?
		// console.log('will sending loot info', 'duels', this.currentReviewId, this.currentDuelsRunId, this.duelsInfo);
		if (!this.duelsInfo.LootOptionBundles?.length && !this.duelsInfo.TreasureOption?.length) {
			console.log('no loot option to send, returning', this.duelsInfo);
			return;
		}

		const user = await this.ow.getCurrentUser();
		const treasures: readonly string[] = this.duelsInfo.TreasureOption
			? this.duelsInfo.TreasureOption.map(option => this.allCards.getCardFromDbfId(option)?.id || '' + option)
			: [];
		const input: Input = {
			// TODO: have "paid-duels" be an option as well
			type: 'duels',
			reviewId: this.currentReviewId,
			runId: this.currentDuelsRunId,
			userId: user.userId,
			userName: user.username,
			lootBundles: this.duelsInfo.LootOptionBundles
				? this.duelsInfo.LootOptionBundles.map(bundle => ({
						bundleId: this.allCards.getCardFromDbfId(bundle.BundleId)?.id || '' + bundle.BundleId,
						elements: bundle.Elements.map(dbfId => this.allCards.getCardFromDbfId(dbfId)?.id || '' + dbfId),
				  }))
				: [],
			chosenLootIndex: this.duelsInfo.ChosenLoot,
			treasureOptions: treasures,
			chosenTreasureIndex: this.duelsInfo.ChosenTreasure,
			currentWins: this.duelsInfo.Wins,
			currentLosses: this.duelsInfo.Losses,
			// TODO: send paid / normal rating depending on game mode
			rating: this.duelsInfo.Rating,
		};
		console.log('[dungeon-loot-parser] sending loot into', input);
		this.api.callPostApiWithRetries(DUNGEON_LOOT_INFO_URL, input);
	}
}
