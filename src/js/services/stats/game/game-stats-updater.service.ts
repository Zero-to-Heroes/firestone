import { EventEmitter, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameEvent } from '../../../models/game-event';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../models/mainwindow/stats/game-stats';
import { AllCardsService } from '../../all-cards.service';
import { DeckParserService } from '../../decktracker/deck-parser.service';
import { GameStateService } from '../../decktracker/game-state.service';
import { Events } from '../../events.service';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { MainWindowStoreEvent } from '../../mainwindow/store/events/main-window-store-event';
import { RecomputeGameStatsEvent } from '../../mainwindow/store/events/stats/recompute-game-stats-event';
import { GameParserService } from '../../manastorm-bridge/game-parser.service';
import { PlayersInfoService } from '../../players-info.service';

@Injectable()
export class GameStatsUpdaterService {
	// This is set directly by the store
	public stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private currentGameStat: GameStat = undefined;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private cards: AllCardsService,
		private gameParserService: GameParserService,
		private deckParser: DeckParserService,
		private playersInfo: PlayersInfoService,
		private logger: NGXLogger,
		private gameState: GameStateService,
	) {
		this.init();
	}

	// I'm not sure whether I should remove this completely from the store
	// (which is probably a bad idea, since the UI will need the stats at some point)
	// or move the event notification somewhere else (in the processor?). The event
	// is needed by the achievement requirements
	public async recomputeGameStats(gameStats: GameStats): Promise<GameStats> {
		// Build the new stat ourselves, as we have no way of being notified when
		// the new stat will be available on the remote db
		const gameStat: GameStat = await this.buildGameStat();
		const newStats: readonly GameStat[] = [gameStat, ...gameStats.stats];
		this.logger.debug('[game-stats-updater] built new game stats', newStats);
		const result = Object.assign(new GameStats(), gameStats, {
			stats: newStats,
		} as GameStats);
		this.events.broadcast(Events.GAME_STATS_UPDATED, result);
		return result;
	}

	private init() {
		this.gameEvents.allEvents.subscribe(async (event: GameEvent) => {
			if (event.type === GameEvent.GAME_START) {
				this.currentGameStat = new GameStat();
			} else if (event.type === GameEvent.FIRST_PLAYER) {
				this.currentGameStat = this.assignCoinPlay(event);
			} else if (event.type === GameEvent.MATCH_METADATA) {
				this.currentGameStat = this.assignMetadata(event);
			} else if (event.type === GameEvent.LOCAL_PLAYER) {
				this.currentGameStat = await this.assignLocalPlayer(event);
			} else if (event.type === GameEvent.OPPONENT) {
				this.currentGameStat = await this.assignOpponent(event);
			} else if (event.type === GameEvent.WINNER) {
				this.currentGameStat = this.assignResult(event);
			} else if (event.type === GameEvent.TIE) {
				this.currentGameStat = Object.assign(new GameStat(), this.currentGameStat, {
					result: 'tied',
				} as GameStat);
			}
		});
		// Wait until the review is properly uploaded, to avoid showing
		// notifications without substance
		this.events.on(Events.REVIEW_FINALIZED).subscribe(data => {
			this.stateUpdater.next(new RecomputeGameStatsEvent());
		});
	}

	private assignCoinPlay(event: GameEvent): GameStat {
		const coinPlay = event.localPlayer.Id === event.entityId ? 'play' : 'coin';
		const newStat = Object.assign(new GameStat(), this.currentGameStat, {
			coinPlay: coinPlay,
		} as GameStat);
		// this.logger.debug('[game-stats-updater] assigned coinPlay', coinPlay);
		return newStat;
	}

	private assignMetadata(event: GameEvent): GameStat {
		this.logger.debug('[game-stats-updater] assigning metadata');
		const gameType = this.gameParserService.toGameType(event.additionalData.metaData.GameType);
		const formatType = this.gameParserService.toFormatType(event.additionalData.metaData.FormatType);
		const newStat = Object.assign(new GameStat(), this.currentGameStat, {
			gameMode: gameType,
			gameFormat: formatType,
		} as GameStat);
		// this.logger.debug('[game-stats-updater] assigned meta data', this.currentGameStat);
		return newStat;
	}

	private async assignLocalPlayer(event: GameEvent): Promise<GameStat> {
		this.logger.debug('[game-stats-updater] assigning local player');
		const playerCardId = event.localPlayer.CardID;
		const playerClass =
			playerCardId && this.cards && this.cards.getCard(playerCardId)
				? this.cards.getCard(playerCardId).playerClass.toLowerCase()
				: undefined;
		const playerInfo = await this.playersInfo.getPlayerInfo();
		if (!playerInfo) {
			console.error('[game-stats-updater] no local player info returned by mmindvision', playerInfo);
		}
		let playerRank;
		if (playerInfo && this.currentGameStat.gameFormat === 'standard') {
			if (playerInfo.standardLegendRank > 0) {
				playerRank = 'legend';
			} else {
				playerRank = playerInfo.standardRank;
			}
		} else if (playerInfo && this.currentGameStat.gameFormat === 'wild') {
			if (playerInfo.wildLegendRank > 0) {
				playerRank = 'legend';
			} else {
				playerRank = playerInfo.wildRank;
			}
		}
		const newStat = Object.assign(new GameStat(), this.currentGameStat, {
			playerName: event.localPlayer.Name,
			playerClass: playerClass,
			playerCardId: playerCardId,
			playerDecklist: this.deckParser.currentDeck ? this.deckParser.currentDeck.deckstring : undefined,
			playerDeckName: this.deckParser.currentDeck ? this.deckParser.currentDeck.name : undefined,
			playerRank: playerRank,
		} as GameStat);
		// this.logger.debug('[game-stats-updater] assigned local player', this.currentGameStat);
		return newStat;
	}

	private async assignOpponent(event: GameEvent): Promise<GameStat> {
		this.logger.debug('[game-stats-updater] assigning opponent');
		const opponentCardId = event.opponentPlayer.CardID;
		const opponentClass =
			opponentCardId && this.cards && this.cards.getCard(opponentCardId)
				? this.cards.getCard(opponentCardId).playerClass.toLowerCase()
				: undefined;
		const opponentInfo = await this.playersInfo.getOpponentInfo();
		if (!opponentInfo) {
			console.error('[game-stats-updater] no local player info returned by mmindvision', opponentInfo);
		}
		let opponentRank;
		if (opponentInfo && this.currentGameStat.gameFormat === 'standard') {
			if (opponentInfo.standardLegendRank > 0) {
				opponentRank = 'legend';
			} else {
				opponentRank = opponentInfo.standardRank;
			}
		} else if (opponentInfo && this.currentGameStat.gameFormat === 'wild') {
			if (opponentInfo.wildLegendRank > 0) {
				opponentRank = 'legend';
			} else {
				opponentRank = opponentInfo.wildRank;
			}
		}
		const newStat = Object.assign(new GameStat(), this.currentGameStat, {
			opponentClass: opponentClass,
			opponentCardId: opponentCardId,
			opponentRank: opponentRank,
		} as GameStat);
		// this.logger.debug('[game-stats-updater] assigned opponent', this.currentGameStat);
		return newStat;
	}

	private assignResult(event: GameEvent): GameStat {
		this.logger.debug('[game-stats-updater] assigning winner');
		const result = event.localPlayer.Id === event.additionalData.winner.Id ? 'won' : 'lost';
		const newStat = Object.assign(new GameStat(), this.currentGameStat, {
			result: result,
		} as GameStat);
		// this.logger.debug('[game-stats-updater] assigned winner', this.currentGameStat);
		return newStat;
	}

	private async buildGameStat(): Promise<GameStat> {
		return Object.assign(new GameStat(), this.currentGameStat, {
			creationTimestamp: Date.now(),
			reviewId: await this.gameState.getCurrentReviewId(),
		} as GameStat);
	}
}
