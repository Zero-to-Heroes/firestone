/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { BgsHeroStatsV2, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Config } from '@firestone/battlegrounds/core';
import {
	BgsMetaHeroStatTierItem,
	BgsMetaHeroStatsAccessService,
	buildHeroStats,
} from '@firestone/battlegrounds/data-access';
import { DiskCacheService, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, deepEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, map, shareReplay } from 'rxjs';
import { DEFAULT_MMR_PERCENTILE } from './bgs-player-hero-stats.service';

export const BG_USE_ANOMALIES = true;

@Injectable()
export class BgsMetaHeroStatsService extends AbstractFacadeService<BgsMetaHeroStatsService> {
	public metaHeroStats$$: SubscriberAwareBehaviorSubject<BgsHeroStatsV2 | null>;
	public tiers$$: SubscriberAwareBehaviorSubject<readonly BgsMetaHeroStatTierItem[] | null>;

	private diskCache: DiskCacheService;
	private access: BgsMetaHeroStatsAccessService;
	private prefs: PreferencesService;
	private allCards: CardsFacadeService;

	private internalSubject: SubscriberAwareBehaviorSubject<boolean>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaHeroStatsService', () => !!this.metaHeroStats$$);
	}

	protected override assignSubjects() {
		this.metaHeroStats$$ = this.mainInstance.metaHeroStats$$;
		this.tiers$$ = this.mainInstance.tiers$$;
	}

	protected async init() {
		this.metaHeroStats$$ = new SubscriberAwareBehaviorSubject<BgsHeroStatsV2 | null>(null);
		this.tiers$$ = new SubscriberAwareBehaviorSubject<readonly BgsMetaHeroStatTierItem[] | null>(null);
		this.internalSubject = new SubscriberAwareBehaviorSubject<boolean>(false);
		this.diskCache = AppInjector.get(DiskCacheService);
		this.access = AppInjector.get(BgsMetaHeroStatsAccessService);
		this.prefs = AppInjector.get(PreferencesService);
		this.allCards = AppInjector.get(CardsFacadeService);

		this.metaHeroStats$$.onFirstSubscribe(() => {
			this.internalSubject.subscribe();
		});
		this.tiers$$.onFirstSubscribe(() => {
			this.internalSubject.subscribe();
		});

		this.internalSubject.onFirstSubscribe(async () => {
			// Load cached values
			const localStats = await this.diskCache.getItem<BgsHeroStatsV2>(
				DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS,
			);
			console.debug('[bgs-meta-hero] localStats', localStats);
			if (!!localStats?.heroStats?.length) {
				this.metaHeroStats$$.next(localStats);
			}

			const config$ = this.prefs.preferences$$.pipe(
				map((prefs) => {
					const config: Config = {
						rankFilter: prefs.bgsActiveRankFilter === 1 ? 10 : prefs.bgsActiveRankFilter,
						tribesFilter: prefs.bgsActiveTribesFilter,
						timeFilter: prefs.bgsActiveTimeFilter,
						anomaliesFilter: prefs.bgsActiveAnomaliesFilter,
						options: {
							convervativeEstimate: prefs.bgsHeroesUseConservativeEstimate,
						},
					} as Config;
					return config;
				}),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				map((config) => ({
					...config,
					gameMode: 'battlegrounds' as const,
				})),
				shareReplay(1),
			);

			// Load remote info
			config$.subscribe(async (config) => {
				console.log('[bgs-meta-hero] loading meta hero stats', config.timeFilter, config.rankFilter);
				this.metaHeroStats$$.next(null);
				this.tiers$$.next(null);

				const stats = await this.getStats(config);
				this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS, stats);
				this.metaHeroStats$$.next(stats);

				const tiers = await this.getTiers(config, stats);
				console.debug('[bgs-meta-hero] tiers', tiers);
				this.tiers$$.next(tiers);
			});
		});
	}

	public async getStats(config: Config): Promise<BgsHeroStatsV2 | null> {
		return this.mainInstance.getStatsInternal(config);
	}

	private async getStatsInternal(config: Config): Promise<BgsHeroStatsV2 | null> {
		const mmr = config.rankFilter || DEFAULT_MMR_PERCENTILE;
		const stats = await this.access.loadMetaHeroStats(
			config.timeFilter,
			BG_USE_ANOMALIES ? config.anomaliesFilter : null,
			mmr,
		);
		return stats;
	}

	public async getMmrPercentiles(config: Config): Promise<readonly MmrPercentile[] | null> {
		return this.mainInstance.getMmrPercentilesInternal(config);
	}

	private async getMmrPercentilesInternal(config: Config): Promise<readonly MmrPercentile[] | null> {
		const stats = await this.access.loadMetaHeroMmrPercentiles(config.timeFilter);
		return stats;
	}

	public async getTiers(
		config: Config,
		inputStats?: BgsHeroStatsV2 | null,
	): Promise<readonly BgsMetaHeroStatTierItem[] | null> {
		return this.mainInstance.getTiersInternal(config, inputStats);
	}

	private async getTiersInternal(
		config: Config,
		inputStats?: BgsHeroStatsV2 | null,
	): Promise<readonly BgsMetaHeroStatTierItem[] | null> {
		const stats = inputStats ?? (await this.getStats(config));
		const result: readonly BgsMetaHeroStatTierItem[] | null = !stats?.heroStats
			? null
			: buildHeroStats(
					stats?.heroStats,
					config.tribesFilter ?? [],
					// config.anomaliesFilter ?? [],
					!!config.options?.convervativeEstimate,
					true,
					this.allCards,
			  );
		return result;
	}
}
