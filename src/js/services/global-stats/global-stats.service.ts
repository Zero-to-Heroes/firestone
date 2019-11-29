import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GlobalStats } from '../../models/mainwindow/stats/global/global-stats';
import { OverwolfService } from '../overwolf.service';

const GLOBAL_STATS_ENDPOINT = 'https://dozgz6y7pf.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class GlobalStatsService {
	private cachedStats: GlobalStats;

	constructor(
		private readonly http: HttpClient,
		private readonly logger: NGXLogger,
		private readonly ow: OverwolfService,
	) {}

	public async getGlobalStats(): Promise<GlobalStats> {
		return new Promise<GlobalStats>(async resolve => {
			const user = await this.ow.getCurrentUser();
			if (!user.userId || !user.username) {
				this.logger.warn('[global-stats] user not logged in', user);
			}
			this.getGlobalStatsInternal(user.userId, stats => resolve(stats), 10);
		});
	}

	private getGlobalStatsInternal(userId: string, callback, retriesLeft = 30) {
		if (retriesLeft <= 0) {
			this.logger.error('[global-stats] could not retrieve stats');
			callback(null);
			return;
		}
		this.http.get(`${GLOBAL_STATS_ENDPOINT}/${userId}`).subscribe(
			(data: any) => {
				// Stats are guaranteed to change between two games betwen they record
				// the time spend in games
				if (!data || !data.result || this.areEqual(data.result, this.cachedStats)) {
					setTimeout(() => this.getGlobalStatsInternal(userId, callback, retriesLeft - 1), 1000);
					return;
				}
				this.logger.debug('[global-stats] received stats');
				const stats: GlobalStats = data.result;
				this.cachedStats = stats;
				callback(stats);
			},
			error => {
				setTimeout(() => this.getGlobalStatsInternal(userId, callback, retriesLeft - 1), 1000);
			},
		);
	}

	private areEqual(stats1: GlobalStats, stats2: GlobalStats): boolean {
		if (!stats1 || !stats2) {
			this.logger.debug('[global-stats] at least one stat is empty, so not equal');
			return false;
		}
		if ((stats1.stats || []).length !== (stats2.stats || []).length) {
			this.logger.debug('[global-stats] stats dont have the same length, so not equal');
			return false;
		}
		const sorted1 = [...stats1.stats].sort((a, b) => a.id - b.id);
		const sorted2 = [...stats2.stats].sort((a, b) => a.id - b.id);
		if (JSON.stringify(sorted1.map(stat => stat.statKey)) !== JSON.stringify(sorted2.map(stat => stat.statKey))) {
			this.logger.debug('[global-stats] stats dont have the same keys, so not equal');
			return false;
		}
		// Compare the values
		for (let i = 0; i < sorted1.length; i++) {
			if (JSON.stringify(sorted1[i]) !== JSON.stringify(sorted2[i])) {
				this.logger.debug('[global-stats] stats dont have the same content, so not equal');
				return false;
			}
		}
		return true;
	}
}
