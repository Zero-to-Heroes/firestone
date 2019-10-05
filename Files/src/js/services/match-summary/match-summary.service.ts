import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MatchStats } from '../../models/mainwindow/stats/match-stats';
import { MatchStatsAvailableEvent } from '../mainwindow/store/events/stats/match-stats-available-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { OverwolfService } from '../overwolf.service';

const MATCH_STATS_ENDPOINT = 'https://lig1nivwu6.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class MatchSummaryService {
	constructor(
		private readonly ow: OverwolfService,
		private readonly http: HttpClient,
		private readonly store: MainWindowStoreService,
		private readonly logger: NGXLogger,
	) {
		this.init();
	}

	private async init() {
		// TODO:
		this.ow.registerInfo(OverwolfService.MANASTORM_ID, result => {
			this.logger.debug('[match-summary] received manastorm info update', result);
			const info: ManastormInfo = result ? JSON.parse(result.info) : undefined;
			if (info) {
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
				this.logger.debug('[match-summary] received stats', data);
				const stats: MatchStats = data.results ? data.results[0] : undefined;
				this.store.stateUpdater.next(new MatchStatsAvailableEvent(stats));
			},
			error => {
				setTimeout(() => this.queryServerForStats(reviewId, retriesLeft - 1), 1000);
			},
		);
	}
}

interface ManastormInfo {
	readonly type: 'new-review';
	readonly reviewId: string;
	readonly replayUrl: string;
}
