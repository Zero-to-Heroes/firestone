import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GlobalStats } from '../../models/mainwindow/stats/global/global-stats';
import { Events } from '../events.service';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';
import { OverwolfService } from '../overwolf.service';

const GLOBAL_STATS_ENDPOINT = 'https://dozgz6y7pf.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class GlobalStatsService {
	constructor(
		private readonly http: HttpClient,
		private readonly store: MainWindowStoreService,
		private readonly logger: NGXLogger,
		private readonly events: Events,
		private readonly ow: OverwolfService,
	) {
		this.init();
	}

	private async init() {
		this.listenForEndGame();
	}

	private async listenForEndGame() {
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async event => {
			this.logger.debug('[global-stats] Replay created, received info', event.data[0]);
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review') {
				const user = await this.ow.getCurrentUser();
				if (!user.userId || !user.username) {
					this.logger.warn('[global-stats] user not logged in', user);
				}
				// Here, regularly query the server for the match stats
				this.queryServerForStats(user.userId, 30);
			}
		});
	}

	private queryServerForStats(userId: string, retriesLeft: number) {
		if (retriesLeft <= 0) {
			this.logger.error('[global-stats] could not retrieve stats', userId);
			return;
		}
		this.http.get(`${GLOBAL_STATS_ENDPOINT}/${userId}`).subscribe(
			(data: any) => {
				if (!data || !data.result) {
					setTimeout(() => this.queryServerForStats(userId, retriesLeft - 1), 1000);
					return;
				}
				this.logger.debug('[global-stats] received stats', data);
				const stats: GlobalStats = data.results ? data.results[0] : undefined;
				// this.store.stateUpdater.next(new GlobalStatsUpdatedEvent(stats));
			},
			error => {
				setTimeout(() => this.queryServerForStats(userId, retriesLeft - 1), 1000);
			},
		);
	}
}
