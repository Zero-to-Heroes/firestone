import { Injectable } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { DiskCacheService } from '@firestone/shared/framework/core';
import { distinctUntilChanged } from 'rxjs';
import { BgsActiveTimeFilterType } from '../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { ApiRunner } from '../api-runner';
import { BattlegroundsMetaHeroStatsLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-meta-hero-stats-loaded-event';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const META_HERO_STATS_URL = 'https://static.zerotoheroes.com/api/bgs/stats-v2/bgs-%timeSuffix%.gz.json';

@Injectable()
export class BgsMetaHeroStatsService {
	constructor(
		private readonly diskCache: DiskCacheService,
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
	) {
		this.init();
	}

	private init() {
		this.store
			.listenPrefs$((prefs) => prefs.bgsActiveTimeFilter)
			.pipe(distinctUntilChanged())
			.subscribe(async ([timeFilter]) => {
				const stats = await this.loadMetaHeroStats(timeFilter);
				this.diskCache.storeItem(DiskCacheService.BATTLEGROUNDS_META_HERO_STATS, stats);
				this.store.send(new BattlegroundsMetaHeroStatsLoadedEvent(stats));
			});
	}

	public async loadInitialMetaHeroStats() {
		const localStats = await this.diskCache.getItem<BgsHeroStatsV2>(DiskCacheService.BATTLEGROUNDS_META_HERO_STATS);
		console.debug('[bgs-meta-hero] localStats', localStats);
		if (!!localStats?.heroStats?.length) {
			this.store.send(new BattlegroundsMetaHeroStatsLoadedEvent(localStats));
		}

		// Not necessary, as this will be triggered by the bgsActiveTimeFilter listener
		// const prefs = await this.prefs.getPreferences();
		// const timeFilter = prefs.bgsActiveTimeFilter;
		// this.loadMetaHeroStats(timeFilter);
	}

	private async loadMetaHeroStats(timeFilter: BgsActiveTimeFilterType) {
		const url = META_HERO_STATS_URL.replace('%timeSuffix%', timeFilter);
		console.debug('[bgs-meta-hero] url', url);
		const result = await this.api.callGetApi<BgsHeroStatsV2>(url);
		console.debug('[bgs-meta-hero] result', result);
		return result;
	}
}
