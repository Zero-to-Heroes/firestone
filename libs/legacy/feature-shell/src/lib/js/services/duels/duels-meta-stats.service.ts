import { Injectable } from '@angular/core';
import { DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsMetaHeroStatsAccessService } from '@firestone/duels/data-access';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { distinctUntilChanged } from 'rxjs';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class DuelsMetaStatsService {
	public duelsMetaStats$$ = new SubscriberAwareBehaviorSubject<DuelsStat>(null);

	constructor(
		private readonly duelsAccess: DuelsMetaHeroStatsAccessService,
		private readonly store: AppUiStoreFacadeService,
	) {
		window['duelsMetaStats'] = this;
		this.init();
	}

	private async init(): Promise<void> {
		this.duelsMetaStats$$.onFirstSubscribe(async () => {
			this.store
				.listenPrefs$(
					(prefs) => prefs.duelsActiveMmrFilter,
					(prefs) => prefs.duelsActiveTimeFilter,
				)
				.pipe(distinctUntilChanged(([aMmr, aTime], [bMmr, bTime]) => aMmr === bMmr && aTime === bTime))
				.subscribe(async ([mmr, time]) => {
					const metaStats = await this.duelsAccess.loadMetaHeroes(mmr, time);
					console.log('[duels-meta-stats] loaded meta stats', mmr, time, metaStats?.heroes?.length);
					this.duelsMetaStats$$.next(metaStats);
				});
		});
	}
}
