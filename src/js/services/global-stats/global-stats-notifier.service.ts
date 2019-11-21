import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
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
		private readonly logger: NGXLogger,
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
			this.logger.debug('[global-stats] Replay created, received info');
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
		const user = await this.ow.getCurrentUser();
		if (!user.userId || !user.username) {
			this.logger.warn('[global-stats] user not logged in', user);
		}
		// Not sure what the best approach is here to be sure we have the latest
		// version of the stats.
		// Using a version id might work? But it would dramatically change the way
		// they are handled.
		const stats = await this.globalStats.getGlobalStats();
		this.store.stateUpdater.next(new GlobalStatsUpdatedEvent(stats));
		// So we just query the stats several times
		setTimeout(async () => {
			this.handleNewGlobalStats(retriesLeft - 1);
		}, 6000);
	}
}
