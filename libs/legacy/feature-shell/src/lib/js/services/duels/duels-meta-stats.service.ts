import { Injectable } from '@angular/core';
import { DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsMetaHeroStatsAccessService } from '@firestone/duels/data-access';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { distinctUntilChanged, map } from 'rxjs';

@Injectable()
export class DuelsMetaStatsService extends AbstractFacadeService<DuelsMetaStatsService> {
	public duelsMetaStats$$: SubscriberAwareBehaviorSubject<DuelsStat>;

	private duelsAccess: DuelsMetaHeroStatsAccessService;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'DuelsMetaStatsService', () => !!this.duelsMetaStats$$);
	}

	protected override assignSubjects() {
		this.duelsMetaStats$$ = this.mainInstance.duelsMetaStats$$;
	}

	protected async init() {
		this.duelsMetaStats$$ = new SubscriberAwareBehaviorSubject<DuelsStat | null>(null);
		this.duelsAccess = AppInjector.get(DuelsMetaHeroStatsAccessService);
		this.prefs = AppInjector.get(PreferencesService);

		await this.prefs.isReady();

		this.duelsMetaStats$$.onFirstSubscribe(async () => {
			this.prefs.preferences$$
				.pipe(
					map((prefs) => ({
						mmr: prefs.duelsActiveMmrFilter,
						time: prefs.duelsActiveTimeFilter,
					})),
					distinctUntilChanged(
						({ mmr: aMmr, time: aTime }, { mmr: bMmr, time: bTime }) => aMmr === bMmr && aTime === bTime,
					),
				)
				.subscribe(async ({ mmr, time }) => {
					const metaStats = await this.duelsAccess.loadMetaHeroes(mmr, time);
					console.log('[duels-meta-stats] loaded meta stats', mmr, time, metaStats?.heroes?.length);
					this.duelsMetaStats$$.next(metaStats);
				});
		});
	}
}
