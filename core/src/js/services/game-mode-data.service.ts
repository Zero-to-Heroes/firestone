import { Injectable } from '@angular/core';
import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { filter } from 'rxjs/operators';
import { GameEvent } from '../models/game-event';
import { DeckParserService } from './decktracker/deck-parser.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { MemoryInspectionService } from './plugins/memory-inspection.service';
import { sleep } from './utils';

@Injectable()
export class GameModeDataService {
	constructor(
		private readonly gameEventsEmitter: GameEventsEmitterService,
		private readonly memoryService: MemoryInspectionService,
		private readonly deckParser: DeckParserService,
	) {
		this.init();
	}

	async init() {
		this.gameEventsEmitter.allEvents
			.asObservable()
			.pipe(filter((event) => event.type === GameEvent.MATCH_METADATA))
			.subscribe((event) => {
				console.debug('[match-info] got metadata event', event);
				this.triggerMatchInfoRetrieve(event.additionalData.metaData);
			});
	}

	// Send the info separately and asynchronously, so that we don't block
	// the main processing loop
	// This info is not needed by the tracker, but it is needed by some achievements
	// that rely on the rank
	// Also needed by the Twitch Presence service
	private async triggerMatchInfoRetrieve(metadata: {
		GameType: GameType;
		FormatType: GameFormat;
		ScenarioID: number;
	}) {
		console.debug('[match-info] considering', metadata);
		switch (metadata.GameType) {
			case GameType.GT_RANKED:
				this.triggerRankMatchInfoRetrieve();
				return;
			case GameType.GT_PVPDR:
			case GameType.GT_PVPDR_PAID:
				this.triggerDuelsMatchInfoRetrieve();
				return;
			case GameType.GT_ARENA:
				this.triggerArenaInfoRetrieve();
				return;
			case GameType.GT_MERCENARIES_PVP:
				this.triggerMercsPvPInfoRetrieve();
				return;
		}
	}

	private async triggerMercsPvPInfoRetrieve() {
		let retriesLeft = 20;
		while (retriesLeft > 0) {
			console.debug('[match-info] will get mercsInfo');
			const mercsInfo = await this.memoryService.getMercenariesInfo();
			console.debug('[match-info] afdter mercsInfo mercsInfo', mercsInfo);
			if (mercsInfo?.PvpRating != null) {
				console.debug('[match-info]sending mercsInfo', mercsInfo);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MERCENARIES_INFO,
						additionalData: {
							mercsInfo: mercsInfo,
						},
					} as GameEvent),
				);
				return;
			}
			console.debug('[match-info] missing mercsInfo', mercsInfo);
			await sleep(3000);
			retriesLeft--;
		}
		console.warn('[match-info] could not retrieve mercsInfo');
	}

	private async triggerArenaInfoRetrieve() {
		let retriesLeft = 20;
		while (retriesLeft > 0) {
			const arenaInfo = await this.memoryService.getArenaInfo();
			if (arenaInfo?.losses != null && arenaInfo?.wins != null) {
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.ARENA_INFO,
						additionalData: {
							arenaInfo: arenaInfo,
						},
					} as GameEvent),
				);
				return;
			}
			console.debug('missing arenaInfo', arenaInfo);
			await sleep(3000);
			retriesLeft--;
		}
		console.warn('[match-info] could not retrieve arenaInfo');
	}

	private async triggerDuelsMatchInfoRetrieve() {
		let retriesLeft = 20;
		while (retriesLeft > 0) {
			const duelsInfo = await this.memoryService.getDuelsInfo();
			if (!!duelsInfo?.Rating) {
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.DUELS_INFO,
						additionalData: {
							duelsInfo: duelsInfo,
						},
					} as GameEvent),
				);
				return;
			}
			console.debug('missing duels rank info', duelsInfo);
			await sleep(3000);
			retriesLeft--;
		}
		console.warn('[match-info] could not retrieve duels');
	}

	private async triggerRankMatchInfoRetrieve() {
		let retriesLeft = 20;
		while (retriesLeft > 0) {
			const [matchInfo, playerDeck] = await Promise.all([
				this.memoryService.getMatchInfo(),
				this.deckParser.getCurrentDeck(10000),
			]);
			if (!!matchInfo?.localPlayer && !!matchInfo?.opponent) {
				console.log('[match-info] matchInfo', matchInfo);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MATCH_INFO,
						additionalData: {
							matchInfo: matchInfo,
						},
						localPlayer: {
							deck: playerDeck,
						},
					} as GameEvent),
				);
				return;
			}
			console.debug('[match-info] missing matchInfo', matchInfo);
			await sleep(3000);
			retriesLeft--;
		}
		console.warn('[match-info] could not retrieve match info');
	}
}
