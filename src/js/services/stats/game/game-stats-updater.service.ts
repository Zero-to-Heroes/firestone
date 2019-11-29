import { EventEmitter, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
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
import { GameStatsLoaderService } from './game-stats-loader.service';

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
		private statsLoader: GameStatsLoaderService,
	) {
		this.init();
	}

	// I'm not sure whether I should remove this completely from the store
	// (which is probably a bad idea, since the UI will need the stats at some point)
	// or move the event notification somewhere else (in the processor?). The event
	// is needed by the achievement requirements
	public async recomputeGameStats(gameStats: GameStats, reviewId: string): Promise<GameStats> {
		const result = await this.statsLoader.retrieveStats(reviewId);
		if (result) {
			this.events.broadcast(Events.GAME_STATS_UPDATED, result);
		}
		return result || gameStats;
	}

	private init() {
		// Wait until the review is properly uploaded, to avoid showing
		// notifications without substance
		this.events.on(Events.REVIEW_FINALIZED).subscribe(data => {
			this.stateUpdater.next(new RecomputeGameStatsEvent(data.data[0] ? data.data[0].reviewId : null));
		});
	}
}
