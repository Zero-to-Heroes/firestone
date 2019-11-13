import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GlobalStats } from '../../models/mainwindow/stats/global/global-stats';
import { OverwolfService } from '../overwolf.service';

const GLOBAL_STATS_ENDPOINT = 'https://dozgz6y7pf.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class GlobalStatsService {
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
				if (!data || !data.result) {
					setTimeout(() => this.getGlobalStatsInternal(userId, callback, retriesLeft - 1), 1000);
					return;
				}
				this.logger.debug('[global-stats] received stats');
				const stats: GlobalStats = data.result;
				callback(stats);
			},
			error => {
				setTimeout(() => this.getGlobalStatsInternal(userId, callback, retriesLeft - 1), 1000);
			},
		);
	}
}
