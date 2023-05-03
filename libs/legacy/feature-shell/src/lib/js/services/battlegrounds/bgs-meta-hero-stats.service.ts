import { Injectable } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { BgsMetaHeroStatsAccessService } from '@firestone/battlegrounds/data-access';
import { DiskCacheService } from '@firestone/shared/framework/core';
import { distinctUntilChanged } from 'rxjs';
import { BattlegroundsMetaHeroStatsLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-meta-hero-stats-loaded-event';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class BgsMetaHeroStatsService {
	constructor(
		private readonly diskCache: DiskCacheService,
		private readonly store: AppUiStoreFacadeService,
		private readonly access: BgsMetaHeroStatsAccessService,
	) {
		this.init();
	}

	private init() {
		this.store
			.listenPrefs$((prefs) => prefs.bgsActiveTimeFilter)
			.pipe(distinctUntilChanged())
			.subscribe(async ([timeFilter]) => {
				const stats = await this.access.loadMetaHeroStats(timeFilter);
				this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS, stats);
				this.store.send(new BattlegroundsMetaHeroStatsLoadedEvent(stats));
			});
	}

	public async loadInitialMetaHeroStats() {
		const localStats = await this.diskCache.getItem<BgsHeroStatsV2>(
			DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS,
		);
		console.debug('[bgs-meta-hero] localStats', localStats);
		if (!!localStats?.heroStats?.length) {
			this.store.send(new BattlegroundsMetaHeroStatsLoadedEvent(localStats));
		}

		// Not necessary, as this will be triggered by the bgsActiveTimeFilter listener
		// const prefs = await this.prefs.getPreferences();
		// const timeFilter = prefs.bgsActiveTimeFilter;
		// this.loadMetaHeroStats(timeFilter);
	}
}
