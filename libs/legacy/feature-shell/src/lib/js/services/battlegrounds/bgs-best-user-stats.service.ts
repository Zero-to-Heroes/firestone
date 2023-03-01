import { Injectable } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { LocalStorageService, OverwolfService } from '@firestone/shared/framework/core';
import { ApiRunner } from '../api-runner';
import { BgsBestStatsLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-best-stats-loaded-event';
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
		const localInfo = this.localStorage.getItem<LocalBgsBestStats>(LocalStorageService.USER_BGS_BEST_STATS);
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
		this.localStorage.setItem(LocalStorageService.USER_BGS_BEST_STATS, newInfo);
		console.log('loaded remote bestBgsStats');
		this.store.send(new BgsBestStatsLoadedEvent(newInfo.stats));
		return remoteData;
	}
}

interface LocalBgsBestStats {
	readonly lastUpdateDate: Date;
	readonly stats: readonly BgsBestStat[];
}
