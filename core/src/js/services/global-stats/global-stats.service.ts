import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { CurrentUser } from '../../models/overwolf/profile/current-user';
import { OverwolfService } from '../overwolf.service';

const GLOBAL_STATS_ENDPOINT = 'https://dozgz6y7pf.execute-api.us-west-2.amazonaws.com/Prod/globalStats';

@Injectable()
export class GlobalStatsService {
	private cachedStats: GlobalStats;

	constructor(private readonly http: HttpClient, private readonly ow: OverwolfService) {}

	public async getGlobalStats(): Promise<GlobalStats> {
		return new Promise<GlobalStats>(async (resolve) => {
			const user = await this.ow.getCurrentUser();
			if (!user.userId || !user.username) {
				console.log('[global-stats] user not logged in', user);
			}
			this.getGlobalStatsInternal(user, (stats) => resolve(stats), 5);
		});
	}

	private getGlobalStatsInternal(currentUser: CurrentUser, callback, retriesLeft = 5, shouldLogError = false) {
		const postEvent = {
			userName: currentUser.username,
			userId: currentUser.userId,
			machineId: currentUser.machineId,
		};
		if (retriesLeft <= 0) {
			if (shouldLogError) {
				console.error('[global-stats] could not retrieve stats', postEvent);
			} else {
				console.log('[global-stats] could not retrieve stats', postEvent);
			}
			callback(null);
			return;
		}
		this.http.post(`${GLOBAL_STATS_ENDPOINT}`, postEvent).subscribe(
			(data: any) => {
				// Stats are guaranteed to change between two games betwen they record
				// the time spend in games
				const areEqual = this.areEqual(data.result, this.cachedStats);
				if (!data || !data.result || areEqual) {
					// console.log('[global-stats] invalid stats received', data == null, areEqual);
					setTimeout(
						() =>
							this.getGlobalStatsInternal(
								currentUser,
								callback,
								retriesLeft - 1,
								!areEqual && !data.expectedEmpty,
							),
						2000,
					);
					return;
				}
				console.log('[global-stats] received stats');
				const stats: GlobalStats = data.result;
				this.cachedStats = stats;
				callback(stats);
			},
			(error) => {
				setTimeout(() => this.getGlobalStatsInternal(currentUser, callback, retriesLeft - 1), 1000);
			},
		);
	}

	private areEqual(stats1: GlobalStats, stats2: GlobalStats): boolean {
		if (!stats1 || !stats2) {
			console.log('[global-stats] at least one stat is empty, so not equal');
			return false;
		}
		if ((stats1.stats || []).length !== (stats2.stats || []).length) {
			console.log('[global-stats] stats dont have the same length, so not equal');
			return false;
		}
		const sorted1 = [...stats1.stats].sort((a, b) => a.id - b.id);
		const sorted2 = [...stats2.stats].sort((a, b) => a.id - b.id);
		if (
			JSON.stringify(sorted1.map((stat) => stat.statKey)) !== JSON.stringify(sorted2.map((stat) => stat.statKey))
		) {
			console.log('[global-stats] stats dont have the same keys, so not equal');
			return false;
		}
		// Compare the values
		for (let i = 0; i < sorted1.length; i++) {
			if (JSON.stringify(sorted1[i]) !== JSON.stringify(sorted2[i])) {
				console.log('[global-stats] stats dont have the same content, so not equal');
				return false;
			}
		}
		return true;
	}
}
