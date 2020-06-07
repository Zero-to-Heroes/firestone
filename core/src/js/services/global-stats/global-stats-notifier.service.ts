import { Injectable } from '@angular/core';
import { Events } from '../events.service';
import { GlobalStatsUpdatedEvent } from '../mainwindow/store/events/stats/global/global-stats-updated-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';
import { GlobalStatsService } from './global-stats.service';

@Injectable()
export class GlobalStatsNotifierService {
	constructor(
		private readonly store: MainWindowStoreService,
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly globalStats: GlobalStatsService,
	) {
		this.init();
	}

	private async init() {
		this.listenForEndGame();
	}

	private async listenForEndGame() {
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async event => {
			console.log('[global-stats] Replay created, received info');
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review') {
				this.handleNewGlobalStats();
			}
		});
	}

	private async handleNewGlobalStats(retriesLeft = 3) {
		if (retriesLeft <= 0) {
			return;
		}
		const stats = await this.globalStats.getGlobalStats();
		if (stats) {
			this.store.stateUpdater.next(new GlobalStatsUpdatedEvent(stats));
		}
	}
}
