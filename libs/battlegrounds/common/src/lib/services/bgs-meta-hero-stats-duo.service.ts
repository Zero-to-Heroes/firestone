/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import {
	BgsMetaHeroStatTierItem,
	BgsMetaHeroStatsAccessService,
	buildHeroStats,
} from '@firestone/battlegrounds/data-access';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, deepEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	DiskCacheService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, map, tap } from 'rxjs';
import { BG_USE_ANOMALIES } from './bgs-meta-hero-stats.service';

@Injectable()
export class BgsMetaHeroStatsDuoService extends AbstractFacadeService<BgsMetaHeroStatsDuoService> {
	public metaHeroStats$$: SubscriberAwareBehaviorSubject<BgsHeroStatsV2 | null>;
	public tiers$$: SubscriberAwareBehaviorSubject<readonly BgsMetaHeroStatTierItem[] | null>;

	private diskCache: DiskCacheService;
	private access: BgsMetaHeroStatsAccessService;
	private prefs: PreferencesService;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaHeroStatsDuoService', () => !!this.metaHeroStats$$);
	}

	protected override assignSubjects() {
		this.metaHeroStats$$ = this.mainInstance.metaHeroStats$$;
		this.tiers$$ = this.mainInstance.tiers$$;
	}

	protected async init() {
		this.metaHeroStats$$ = new SubscriberAwareBehaviorSubject<BgsHeroStatsV2 | null>(null);
		this.tiers$$ = new SubscriberAwareBehaviorSubject<readonly BgsMetaHeroStatTierItem[] | null>(null);
		this.diskCache = AppInjector.get(DiskCacheService);
		this.access = AppInjector.get(BgsMetaHeroStatsAccessService);
		this.prefs = AppInjector.get(PreferencesService);
		this.allCards = AppInjector.get(CardsFacadeService);

		this.metaHeroStats$$.onFirstSubscribe(async () => {
			// Load cached values
			const localStats = await this.diskCache.getItem<BgsHeroStatsV2>(
				DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS_DUO,
			);
			console.debug('[bgs-meta-hero-duo] localStats', localStats);
			if (!!localStats?.heroStats?.length) {
				this.metaHeroStats$$.next(localStats);
			}

			// Load remote info
			this.prefs.preferences$$
				.pipe(
					map((prefs) => ({
						timeFilter: prefs.bgsActiveTimeFilter,
						mmrFilter: prefs.bgsActiveRankFilter,
						useMmrFilter: prefs.bgsActiveUseMmrFilterInHeroSelection,
					})),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				)
				.subscribe(async ({ timeFilter, mmrFilter, useMmrFilter }) => {
					console.log('[bgs-meta-hero-duo] loading meta hero stats', timeFilter, mmrFilter, useMmrFilter);
					this.metaHeroStats$$.next(null);

					const mmr = useMmrFilter ? mmrFilter : 100;
					const stats = await this.access.loadMetaHeroStatsDuo(timeFilter, mmr);
					this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS_DUO, stats);
					this.metaHeroStats$$.next(stats);
				});
		});

		this.tiers$$.onFirstSubscribe(() => {
			combineLatest([
				this.metaHeroStats$$,
				this.prefs.preferences$$.pipe(
					map((prefs) => ({
						bgsActiveRankFilter: prefs.bgsActiveRankFilter,
						bgsActiveTribesFilter: prefs.bgsActiveTribesFilter,
						bgsActiveAnomaliesFilter: prefs.bgsActiveAnomaliesFilter,
						bgsHeroesUseConservativeEstimate: prefs.bgsHeroesUseConservativeEstimate,
						useMmrFilter: prefs.bgsActiveUseMmrFilterInHeroSelection,
						useAnomalyFilter: prefs.bgsActiveUseAnomalyFilterInHeroSelection,
					})),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				),
			])
				.pipe(
					tap((info) => console.debug('[bgs-meta-hero-duo] building tiers', info)),
					debounceTime(200),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
					map(
						([
							stats,
							{
								bgsActiveRankFilter,
								bgsActiveTribesFilter,
								bgsActiveAnomaliesFilter,
								bgsHeroesUseConservativeEstimate,
								useMmrFilter,
								useAnomalyFilter,
							},
						]) => {
							const result: readonly BgsMetaHeroStatTierItem[] | null = !stats?.heroStats
								? null
								: buildHeroStats(
										stats?.heroStats,
										// bgsActiveRankFilter,
										bgsActiveTribesFilter,
										bgsActiveAnomaliesFilter,
										bgsHeroesUseConservativeEstimate,
										useMmrFilter,
										BG_USE_ANOMALIES ? useAnomalyFilter : false,
										this.allCards,
								  );
							return result;
						},
					),
					tap((info) => console.debug('[bgs-meta-hero-duo] built tiers', info)),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				)
				.subscribe(this.tiers$$);
		});
	}
}
