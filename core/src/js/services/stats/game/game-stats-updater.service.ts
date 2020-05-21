import { EventEmitter, Injectable } from '@angular/core';
import { Events } from '../../events.service';
import { MainWindowStoreEvent } from '../../mainwindow/store/events/main-window-store-event';
import { RecomputeReplaysEvent } from '../../mainwindow/store/events/replays/recompute-replays-event';
import { RecomputeGameStatsEvent } from '../../mainwindow/store/events/stats/recompute-game-stats-event';
import { GameStatsLoaderService } from './game-stats-loader.service';

@Injectable()
export class GameStatsUpdaterService {
	// This is set directly by the store
	public stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private events: Events, private statsLoader: GameStatsLoaderService) {
		this.init();
	}

	private init() {
		// Wait until the review is properly uploaded, to avoid showing
		// notifications without substance
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async data => {
			// We do it this way to avoid doing the costly retrieveStats operation as part of
			// the store processing, as it blocks other events
			const gameStats = await this.statsLoader.retrieveStats(data.data[0] ? data.data[0].reviewId : null);
			this.events.broadcast(Events.GAME_STATS_UPDATED, gameStats);
			this.stateUpdater.next(new RecomputeGameStatsEvent(gameStats));
			this.stateUpdater.next(new RecomputeReplaysEvent(gameStats));
		});
	}
}
