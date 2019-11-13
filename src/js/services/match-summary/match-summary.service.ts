import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MatchStats } from '../../models/mainwindow/stats/match-stats';
import { Events } from '../events.service';
import { MatchStatsAvailableEvent } from '../mainwindow/store/events/stats/match-stats-available-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { ManastormInfo } from '../manastorm-bridge/manastorm-info';

const MATCH_STATS_ENDPOINT = 'https://lig1nivwu6.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class MatchSummaryService {
	constructor(
		private readonly http: HttpClient,
		private readonly store: MainWindowStoreService,
		private readonly logger: NGXLogger,
		private readonly events: Events,
	) {
		this.init();
	}

	private async init() {
		this.listenForEndGame();
	}

	private async listenForEndGame() {
		this.events.on(Events.REVIEW_FINALIZED).subscribe(event => {
			this.logger.debug('[match-summary] Replay created, received info', event.data[0]);
			const info: ManastormInfo = event.data[0];
			if (info && info.type === 'new-review') {
				// Here, regularly query the server for the match stats
				this.queryServerForStats(info.reviewId, 30);
			}
		});
	}

	private queryServerForStats(reviewId: string, retriesLeft: number) {
		if (retriesLeft <= 0) {
			this.logger.error('[match-summary] could not retrieve stats', reviewId);
			return;
		}
		this.http.get(`${MATCH_STATS_ENDPOINT}/${reviewId}`).subscribe(
			(data: any) => {
				if (!data || !data.results || data.results.length === 0) {
					setTimeout(() => this.queryServerForStats(reviewId, retriesLeft - 1), 1000);
					return;
				}
				this.logger.debug('[match-summary] received stats');
				const stats: MatchStats = data.results ? data.results[0] : undefined;
				this.store.stateUpdater.next(new MatchStatsAvailableEvent(stats));
			},
			error => {
				setTimeout(() => this.queryServerForStats(reviewId, retriesLeft - 1), 1000);
			},
		);
	}
}
