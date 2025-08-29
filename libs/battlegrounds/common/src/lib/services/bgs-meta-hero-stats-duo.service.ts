/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { BgsHeroStatsV2, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import {
	BgsMetaHeroStatTierItem,
	BgsMetaHeroStatsAccessService,
	buildHeroStats,
} from '@firestone/battlegrounds/data-access';
import { Config, equalConfig } from '@firestone/game-state';
import { BG_USE_ANOMALIES, DiskCacheService, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, map, shareReplay } from 'rxjs';
import { DEFAULT_MMR_PERCENTILE } from './bgs-player-hero-stats.service';

@Injectable()
export class BgsMetaHeroStatsDuoService extends AbstractFacadeService<BgsMetaHeroStatsDuoService> {
	public metaHeroStats$$: SubscriberAwareBehaviorSubject<BgsHeroStatsV2 | null>;
	public tiers$$: SubscriberAwareBehaviorSubject<readonly BgsMetaHeroStatTierItem[] | null>;

	private diskCache: DiskCacheService;
	private access: BgsMetaHeroStatsAccessService;
	private prefs: PreferencesService;
	private allCards: CardsFacadeService;

	private internalSubject: SubscriberAwareBehaviorSubject<boolean>;

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
				DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS_DUO,
			);
			console.debug('[bgs-meta-hero-duo] localStats', localStats);
			if (!!localStats?.heroStats?.length) {
				this.metaHeroStats$$.next(localStats);
			}

			const config$ = this.prefs.preferences$$.pipe(
				map((prefs) => {
					const config: Config = {
						rankFilter: prefs.bgsActiveRankFilter === 1 ? 10 : prefs.bgsActiveRankFilter,
						tribesFilter: prefs.bgsActiveTribesFilter,
						timeFilter: prefs.bgsActiveTimeFilter,
						anomaliesFilter: [] as readonly string[], //prefs.bgsActiveAnomaliesFilter,
						options: {
							convervativeEstimate: prefs.bgsHeroesUseConservativeEstimate,
						},
					} as Config;
					return config;
				}),
				distinctUntilChanged((a, b) => equalConfig(a, b)),
				map((config) => ({
					...config,
					gameMode: 'battlegrounds-duo' as const,
				})),
				shareReplay(1),
			);

			config$.subscribe(async (config) => {
				console.log('[bgs-meta-hero-duo] loading meta hero stats', config.timeFilter, config.rankFilter);
				this.metaHeroStats$$.next(null);
				this.tiers$$.next(null);

				const stats = await this.getStats(config);
				this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.BATTLEGROUNDS_META_HERO_STATS_DUO, stats);
				this.metaHeroStats$$.next(stats);

				const tiers = await this.getTiers(config, stats);
				this.tiers$$.next(tiers);
			});
		});
	}

	public async getStats(config: Config): Promise<BgsHeroStatsV2 | null> {
		return this.mainInstance.getStatsInternal(config);
	}

	private async getStatsInternal(config: Config): Promise<BgsHeroStatsV2 | null> {
		const mmr = config.rankFilter || DEFAULT_MMR_PERCENTILE;
		const stats = await this.access.loadMetaHeroStatsDuo(
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
		const stats = await this.access.loadMetaHeroMmrPercentilesDuo(config.timeFilter);
		return stats;
	}

	public async getTiers(
		config: Config,
		inputStats?: BgsHeroStatsV2 | null,
		useDebug = false,
	): Promise<readonly BgsMetaHeroStatTierItem[] | null> {
		return this.mainInstance.getTiersInternal(config, inputStats, useDebug);
	}

	private async getTiersInternal(
		config: Config,
		inputStats?: BgsHeroStatsV2 | null,
		useDebug = false,
	): Promise<readonly BgsMetaHeroStatTierItem[] | null> {
		const stats = inputStats ?? (await this.getStats(config));
		const result: readonly BgsMetaHeroStatTierItem[] | null = !stats?.heroStats
			? null
			: buildHeroStats(
					stats?.heroStats,
					config.tribesFilter ?? [],
					!!config.options?.convervativeEstimate,
					this.allCards,
					'battlegrounds-duo',
					useDebug,
				);
		return result;
	}
}
