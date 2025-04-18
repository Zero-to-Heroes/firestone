import { Injectable } from '@angular/core';
import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { ArenaInfoService } from '@firestone/arena/common';
import { MemoryInspectionService } from '@firestone/memory';
import { filter } from 'rxjs/operators';
import { GameEvent } from '../models/game-event';
import { DeckParserService } from './decktracker/deck-parser.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { sleep } from './utils';

@Injectable()
export class GameModeDataService {
	constructor(
		private readonly gameEventsEmitter: GameEventsEmitterService,
		private readonly memoryService: MemoryInspectionService,
		private readonly deckParser: DeckParserService,
		private readonly arenaInfo: ArenaInfoService,
	) {
		this.init();
	}

	async init() {
		return;
		this.gameEventsEmitter.allEvents
			.asObservable()
			.pipe(
				filter((event) => event.type === GameEvent.MATCH_METADATA),
				// filter((event) => !event.additionalData?.spectating),
			)
			.subscribe((event) => {
				this.triggerMatchInfoRetrieve(event.additionalData.metaData, event.additionalData?.spectating);
			});
	}

	// Send the info separately and asynchronously, so that we don't block
	// the main processing loop
	// This info is not needed by the tracker, but it is needed by some achievements
	// that rely on the rank
	// Also needed by the Twitch Presence service
	private async triggerMatchInfoRetrieve(metadata: HsGameMetaData, spectating: boolean) {
		switch (metadata.GameType) {
			case GameType.GT_ARENA:
				this.triggerRankMatchInfoRetrieve();
				this.arenaInfo.triggerArenaInfoRetrieve(spectating);
				this.triggerPlayerDeckInfoRetrieve(spectating);
				return;
			case GameType.GT_MERCENARIES_PVP:
				this.triggerMercsPvPInfoRetrieve(spectating);
				return;
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
			case GameType.GT_BATTLEGROUNDS_DUO:
			case GameType.GT_BATTLEGROUNDS_DUO_VS_AI:
			case GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI:
				this.triggerBattlegroundsInfoRetrieve(spectating);
				return;
			case GameType.GT_CASUAL:
			case GameType.GT_FSG_BRAWL:
			case GameType.GT_FSG_BRAWL_1P_VS_AI:
			case GameType.GT_FSG_BRAWL_2P_COOP:
			case GameType.GT_FSG_BRAWL_VS_FRIEND:
			case GameType.GT_TAVERNBRAWL:
			case GameType.GT_TB_1P_VS_AI:
			case GameType.GT_TB_2P_COOP:
				this.triggerRankMatchInfoRetrieve();
				this.triggerPlayerDeckInfoRetrieve(spectating);
				return;
			case GameType.GT_RANKED:
				this.triggerRankMatchInfoRetrieve();
				this.triggerPlayerDeckInfoRetrieve(spectating);
				return;
			default:
				this.triggerRankMatchInfoRetrieve();
				this.triggerPlayerDeckInfoRetrieve(spectating);
				return;
		}
	}

	private async triggerBattlegroundsInfoRetrieve(spectating: boolean) {
		if (spectating) {
			return;
		}
		await runLoop(async () => {
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

	private async triggerMercsPvPInfoRetrieve(spectating: boolean) {
		if (spectating) {
			return;
		}
		await runLoop(async () => {
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

	private async triggerRankMatchInfoRetrieve() {
		console.debug('[match-info] triggerRankMatchInfoRetrieve');
		await runLoop(async () => {
			const [matchInfo, playerDeck] = await Promise.all([
				this.memoryService.getMatchInfo(),
				this.deckParser.getCurrentDeck(10000),
			]);
			console.log('[match-info] matchInfo', matchInfo);
			if (!!matchInfo?.localPlayer && !!matchInfo?.opponent) {
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

	private async triggerPlayerDeckInfoRetrieve(spectating: boolean) {
		if (spectating) {
			return;
		}
		await runLoop(async () => {
			const playerDeck = await this.deckParser.getCurrentDeck(10000);
			if (!!playerDeck?.deckstring) {
				console.debug('[match-info] playerDeckInfo', playerDeck);
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
}

export const runLoop = async (coreLoop: () => Promise<boolean>, type: string) => {
	let retriesLeft = 20;
	while (retriesLeft > 0) {
		if (await coreLoop()) {
			return;
		}
		await sleep(3000);
		retriesLeft--;
	}
	console.warn('[match-info] could not retrieve ', type);
};

export interface HsGameMetaData {
	GameType: GameType;
	FormatType: GameFormat;
	ScenarioID: number;
	BuildNumber: number;
}
