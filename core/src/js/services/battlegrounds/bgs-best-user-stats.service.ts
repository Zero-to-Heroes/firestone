import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/compute-bgs-run-stats/dist/model/bgs-best-stat';
import { CurrentUser } from '../../models/overwolf/profile/current-user';
import { OverwolfService } from '../overwolf.service';

const BGS_BEST_USER_STATS_ENDPOINT = 'https://0u2t28wmwe.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class BgsBestUserStatsService {
	constructor(private readonly http: HttpClient, private readonly ow: OverwolfService) {}

	public async getBgsBestUserStats(): Promise<readonly BgsBestStat[]> {
		return new Promise<readonly BgsBestStat[]>(async (resolve) => {
			const user = await this.ow.getCurrentUser();
			if (!user.userId || !user.username) {
				console.warn('[bgs-best-stats] user not logged in', user);
			}
			this.getBgsBestUserStatsInternal(user, (stats) => resolve(stats), 5);
		});
	}

	private getBgsBestUserStatsInternal(currentUser: CurrentUser, callback, retriesLeft = 5) {
		if (retriesLeft <= 0) {
			console.log('[bgs-best-stats] could not retrieve stats', currentUser);
			callback(null);
			return;
		}
		this.http.get(`${BGS_BEST_USER_STATS_ENDPOINT}/${currentUser.username || currentUser.userId}`).subscribe(
			(data: readonly BgsBestStat[]) => {
				console.log('[bgs-best-stats] received stats');
				callback(data);
			},
			(error) => {
				setTimeout(() => this.getBgsBestUserStatsInternal(currentUser, callback, retriesLeft - 1), 2000);
			},
		);
	}
}
