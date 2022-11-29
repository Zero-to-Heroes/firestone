import { Injectable } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { ApiRunner } from '../api-runner';
import { LocalStorageService } from '../local-storage';
import { BgsBestStatsLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-best-stats-loaded-event';
import { OverwolfService } from '../overwolf.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const BGS_BEST_USER_STATS_ENDPOINT = 'https://0u2t28wmwe.execute-api.us-west-2.amazonaws.com/Prod';

@Injectable()
export class BgsBestUserStatsService {
	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly localStorage: LocalStorageService,
		private readonly store: AppUiStoreFacadeService,
	) {}

	public async loadBgsBestUserStats(): Promise<readonly BgsBestStat[]> {
		const localInfo = this.localStorage.getItem<LocalBgsBestStats>('user-bgs-best-stats');
		// This is non-sensitive info, we cache it for a while
		if (
			!!localInfo?.stats?.length &&
			Date.now() - new Date(localInfo.lastUpdateDate).getTime() <= 7 * 24 * 60 * 60 * 1000
		) {
			console.log('loaded local bestBgsStats');
			this.store.send(new BgsBestStatsLoadedEvent(localInfo.stats));
		}

		const currentUser = await this.ow.getCurrentUser();
		const remoteData: readonly BgsBestStat[] = await this.api.callGetApi(
			`${BGS_BEST_USER_STATS_ENDPOINT}/${currentUser.username || currentUser.userId}`,
		);

		const newInfo: LocalBgsBestStats = {
			lastUpdateDate: new Date(),
			stats: remoteData,
		};
		this.localStorage.setItem('user-bgs-best-stats', newInfo);
		console.log('loaded remote bestBgsStats');
		this.store.send(new BgsBestStatsLoadedEvent(newInfo.stats));
		return remoteData;
	}
}

interface LocalBgsBestStats {
	readonly lastUpdateDate: Date;
	readonly stats: readonly BgsBestStat[];
}
