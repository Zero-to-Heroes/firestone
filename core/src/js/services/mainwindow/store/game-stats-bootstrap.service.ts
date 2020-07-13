import { EventEmitter, Injectable } from '@angular/core';
import { GameStats } from '../../../models/mainwindow/stats/game-stats';
import { Events } from '../../events.service';
import { OverwolfService } from '../../overwolf.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { GameStatsInitEvent } from './events/stats/game-stats-init-event';

@Injectable()
export class GameStatsBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly gameStatsLoader: GameStatsLoaderService,
		private readonly ow: OverwolfService,
	) {
		this.events.on(Events.START_POPULATE_GAME_STATS_STATE).subscribe(event => this.initGameStats());
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initGameStats() {
		const newGameStats: GameStats = await this.gameStatsLoader.retrieveStats();
		this.events.broadcast(Events.MATCH_STATS_UPDATED, newGameStats);
		this.stateUpdater.next(new GameStatsInitEvent(newGameStats));
	}
}
