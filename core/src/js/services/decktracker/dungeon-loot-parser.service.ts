import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsInfo } from '../../models/duels-info';
import { GameEvent } from '../../models/game-event';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { uuid } from '../utils';

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
	}

	public async queueingIntoMatch(logLine: string) {
		if (this.goingIntoQueueRegex.exec(logLine)) {
			const currentScene = await this.memory.getCurrentScene();
			// Don't refresh the deck when leaving the match
			if (currentScene !== 'unknown_18') {
				return;
			}

			this.duelsInfo = await this.memory.getDuelsInfo();
			console.log('[dungeon-loot-parser] retrieved duels info', this.duelsInfo);
			// Should already have picked something, but nothing is detected
			if (
				(this.duelsInfo.Wins > 0 || this.duelsInfo.Losses > 0) &&
				!this.duelsInfo.LootOptionBundles?.length &&
				!this.duelsInfo.TreasureOption?.length
			) {
				this.duelsInfo = await this.memory.getDuelsInfo(true);
				console.log('[dungeon-loot-parser] retrieved duels info after force reset', this.duelsInfo);
			}
			// let currentRetries = 5;
			// while (currentRetries >= 0 && !this.duelsInfo?.)

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
		console.log('will sending loot info', 'duels', this.currentReviewId, this.currentDuelsRunId, this.duelsInfo);
	}
}
