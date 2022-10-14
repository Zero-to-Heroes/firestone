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
	private async triggerMatchInfoRetrieve(metadata: HsGameMetaData) {
		console.debug('[match-info] considering', metadata);
		switch (metadata.GameType) {
			case GameType.GT_PVPDR:
			case GameType.GT_PVPDR_PAID:
				this.triggerDuelsMatchInfoRetrieve();
				return;
			case GameType.GT_ARENA:
				this.triggerArenaInfoRetrieve();
				this.triggerPlayerDeckInfoRetrieve();
				return;
			case GameType.GT_MERCENARIES_PVP:
				this.triggerMercsPvPInfoRetrieve();
				return;
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
				this.triggerBattlegroundsInfoRetrieve();
				return;
			case GameType.GT_RANKED:
				this.triggerRankMatchInfoRetrieve();
				this.triggerPlayerDeckInfoRetrieve();
				return;
			default:
				this.triggerPlayerDeckInfoRetrieve();
				return;
		}
	}

	private async triggerBattlegroundsInfoRetrieve() {
		await this.runLoop(async () => {
			const bgInfo = await this.memoryService.getBattlegroundsInfo();
			if (bgInfo?.Rating != null && !!bgInfo.Game?.AvailableRaces?.length) {
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.BATTLEGROUNDS_INFO,
						additionalData: {
							bgInfo: bgInfo,
						},
					} as GameEvent),
				);
				return true;
			}
			return false;
		}, 'bgInfo');
	}

	private async triggerMercsPvPInfoRetrieve() {
		await this.runLoop(async () => {
			const mercsInfo = await this.memoryService.getMercenariesInfo();
			if (mercsInfo?.PvpRating != null) {
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.MERCENARIES_INFO,
						additionalData: {
							mercsInfo: mercsInfo,
						},
					} as GameEvent),
				);
				return true;
			}
			return false;
		}, 'mercsInfo');
	}

	private async triggerArenaInfoRetrieve() {
		await this.runLoop(async () => {
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
				return true;
			}
			return false;
		}, 'arenaInfo');
	}

	private async triggerDuelsMatchInfoRetrieve() {
		await this.runLoop(async () => {
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
				return true;
			}
			return false;
		}, 'duelsInfo');
	}

	private async triggerRankMatchInfoRetrieve() {
		await this.runLoop(async () => {
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
						// Kept for backward compability, but should use PLAYER_DECK event
						localPlayer: {
							deck: playerDeck,
						},
					} as GameEvent),
				);
				return true;
			}
			return false;
		}, 'matchInfo');
	}

	private async triggerPlayerDeckInfoRetrieve() {
		await this.runLoop(async () => {
			const playerDeck = await this.deckParser.getCurrentDeck(10000);
			if (!!playerDeck?.deckstring) {
				console.log('[match-info] playerDeckInfo', playerDeck);
				this.gameEventsEmitter.allEvents.next(
					Object.assign(new GameEvent(), {
						type: GameEvent.PLAYER_DECK_INFO,
						additionalData: {
							playerDeck: playerDeck,
						},
					} as GameEvent),
				);
				return true;
			}
			return false;
		}, 'playerDeckInfo');
	}

	private async runLoop(coreLoop: () => Promise<boolean>, type: string) {
		let retriesLeft = 20;
		while (retriesLeft > 0) {
			if (await coreLoop()) {
				return;
			}
			console.debug('[match-info] missing', type);
			await sleep(3000);
			retriesLeft--;
		}
		console.warn('[match-info] could not retrieve ', type);
	}
}

export interface HsGameMetaData {
	GameType: GameType;
	FormatType: GameFormat;
	ScenarioID: number;
	BuildNumber: number;
}
