import { Injectable } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { distinctUntilChanged } from 'rxjs';
import { BgsActiveTimeFilterType } from '../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { ApiRunner } from '../api-runner';
import { LocalStorageService } from '../local-storage';
import { BattlegroundsMetaHeroStatsLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-meta-hero-stats-loaded-event';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const META_HERO_STATS_URL = 'https://static.zerotoheroes.com/api/bgs/stats-v2/bgs-%timeSuffix%.gz.json?v=4';

@Injectable()
export class BgsMetaHeroStatsService {
	constructor(
		private readonly localStorage: LocalStorageService,
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	private init() {
		this.store
			.listenPrefs$((prefs) => prefs.bgsActiveTimeFilter)
			.pipe(distinctUntilChanged())
			.subscribe(([timeFilter]) => this.loadMetaHeroStats(timeFilter));
	}

	public async loadInitialMetaHeroStats() {
		const localStats = this.localStorage.getItem<BgsHeroStatsV2>('bgs-meta-hero-stats');
		console.debug('[bgs-meta-hero] localStats', localStats);
		if (!!localStats?.heroStats?.length) {
			this.store.send(new BattlegroundsMetaHeroStatsLoadedEvent(localStats));
		}

		const prefs = await this.prefs.getPreferences();
		const timeFilter = prefs.bgsActiveTimeFilter;
		this.loadMetaHeroStats(timeFilter);
	}

	private async loadMetaHeroStats(timeFilter: BgsActiveTimeFilterType) {
		const url = META_HERO_STATS_URL.replace('%timeSuffix%', timeFilter);
		console.debug('[bgs-meta-hero] url', url);
		const result = await this.api.callGetApi<BgsHeroStatsV2>(url);
		console.debug('[bgs-meta-hero] result', result);
		this.localStorage.setItem('bgs-meta-hero-stats', result);
		this.store.send(new BattlegroundsMetaHeroStatsLoadedEvent(result));
	}
}
