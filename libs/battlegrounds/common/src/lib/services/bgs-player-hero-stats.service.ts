/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { ALL_BG_RACES, isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsMetaHeroStatTierItem, enhanceHeroStat } from '@firestone/battlegrounds/data-access';
import { BgsRankFilterType, PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, deepEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { GAME_STATS_PROVIDER_SERVICE_TOKEN, IGameStatsProviderService } from '@firestone/stats/common';
import { toGameTypeEnum } from '@firestone/stats/data-access';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { Config } from '../model/_barrel';
import { BgsMetaHeroStatsDuoService } from './bgs-meta-hero-stats-duo.service';
import { BG_USE_ANOMALIES, BgsMetaHeroStatsService } from './bgs-meta-hero-stats.service';
import { filterBgsMatchStats } from './hero-stats-helper';

export const DEFAULT_MMR_PERCENTILE = 25;

@Injectable()
export class BgsPlayerHeroStatsService extends AbstractFacadeService<BgsPlayerHeroStatsService> {
	public tiersWithPlayerData$$: SubscriberAwareBehaviorSubject<readonly BgsMetaHeroStatTierItem[] | null | undefined>;

	private metaStats: BgsMetaHeroStatsService;
	private metaStatsDuo: BgsMetaHeroStatsDuoService;
	private prefs: PreferencesService;
	private allCards: CardsFacadeService;
	private gameStats: IGameStatsProviderService;
	private patchesConfig: PatchesConfigService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsPlayerHeroStatsService', () => !!this.tiersWithPlayerData$$);
	}

	protected override assignSubjects() {
		this.tiersWithPlayerData$$ = this.mainInstance.tiersWithPlayerData$$;
	}

	protected async init() {
		this.tiersWithPlayerData$$ = new SubscriberAwareBehaviorSubject<
			readonly BgsMetaHeroStatTierItem[] | null | undefined
		>(null);
		this.metaStats = AppInjector.get(BgsMetaHeroStatsService);
		this.metaStatsDuo = AppInjector.get(BgsMetaHeroStatsDuoService);
		this.prefs = AppInjector.get(PreferencesService);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.gameStats = AppInjector.get(GAME_STATS_PROVIDER_SERVICE_TOKEN);
		this.patchesConfig = AppInjector.get(PatchesConfigService);

		await waitForReady(this.patchesConfig, this.metaStats, this.prefs);

		this.tiersWithPlayerData$$.onFirstSubscribe(() => {
			const gameMode$ = this.prefs.preferences$$.pipe(map((prefs) => prefs.bgsActiveGameMode));

			const gameStats$ = this.gameStats.gameStats$$.pipe(
				map((stats) => stats?.filter((s) => isBattlegrounds(toGameTypeEnum(s.gameMode)))),
			);
			// Can probably avoid marking the data as null when changing things like the tribes
			const config$ = combineLatest([
				gameMode$,
				this.prefs.preferences$$.pipe(
					map((prefs) => {
						const config: Config = {
							rankFilter: prefs.bgsActiveRankFilter,
							tribesFilter: prefs.bgsActiveTribesFilter,
							anomaliesFilter: prefs.bgsActiveAnomaliesFilter,
							timeFilter: prefs.bgsActiveTimeFilter,
						} as Config;
						return config;
					}),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				),
			]).pipe(
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				map(([gameMode, config]) => ({
					...config,
					gameMode: gameMode,
				})),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			);

			// Make sure we refresh when game stats are updated
			combineLatest([config$, gameStats$]).subscribe(async ([config]) => {
				console.debug('[bgs-2] refreshing meta hero stats', config);
				this.tiersWithPlayerData$$.next(null);
				const finalStats = await this.buildFinalStats(config, undefined, false);
				this.tiersWithPlayerData$$.next(finalStats?.stats);
			});
		});
	}

	// Not super fan of moving everything to an "await" pattern
	public async buildFinalStats(
		config: Config,
		mmrFilter?: number,
		useDebug = true,
	): Promise<
		| {
				stats: readonly BgsMetaHeroStatTierItem[] | undefined;
				mmrPercentile: MmrPercentile;
				lastUpdatedDate: Date | null;
		  }
		| undefined
	> {
		return this.mainInstance.buildFinalStatsInternal(config, mmrFilter, useDebug);
	}

	private async buildFinalStatsInternal(
		inputConfig: Config,
		mmrFilter?: number,
		useDebug?: boolean,
	): Promise<
		| {
				stats: readonly BgsMetaHeroStatTierItem[] | undefined;
				mmrPercentile: MmrPercentile;
				lastUpdatedDate: Date | null;
		  }
		| undefined
	> {
		// TODO: add a cache of some sort? Or add a facade based on observables that is able to properly centralize
		// the requests of multiple widgets?
		useDebug && console.debug('[bgs-2] rebuilding meta hero stats', inputConfig, mmrFilter);
		const mmrPercentiles: readonly MmrPercentile[] | null =
			inputConfig.gameMode === 'battlegrounds-duo'
				? await this.metaStatsDuo.getMmrPercentiles(inputConfig)
				: await this.metaStats.getMmrPercentiles(inputConfig);
		useDebug && console.debug('[bgs-2] mmrPercentiles', mmrPercentiles);
		const targetPercentile = extractRank(mmrPercentiles, inputConfig.rankFilter, mmrFilter);
		const targetMmr = extractMmr(mmrPercentiles, targetPercentile, mmrFilter);
		const config: Config = {
			...inputConfig,
			rankFilter: targetPercentile,
		};

		const heroStats =
			config.gameMode === 'battlegrounds-duo'
				? await this.metaStatsDuo.getStats(config)
				: await this.metaStats.getStats(config);
		useDebug && console.debug('[bgs-2] retrieved hero stats', heroStats);
		const tiers =
			config.gameMode === 'battlegrounds-duo'
				? await this.metaStatsDuo.getTiers(config, heroStats, useDebug)
				: await this.metaStats.getTiers(config, heroStats);
		useDebug && console.debug('[bgs-2] retrieved tiers', tiers);
		const games = await this.gameStats.gameStats$$.getValueWithInit();
		const patchInfo = await this.patchesConfig.currentBattlegroundsMetaPatch$$.getValueWithInit();
		// const mmrPercentiles = heroStats?.mmrPercentiles ?? [];

		const bgGames = (games ?? [])
			.filter((g) =>
				config.gameMode === 'battlegrounds'
					? ['battlegrounds', 'battlegrounds-friendly'].includes(g.gameMode)
					: ['battlegrounds-duo'].includes(g.gameMode),
			)
			.filter(
				(g) =>
					!config.tribesFilter?.length ||
					config.tribesFilter.length === ALL_BG_RACES.length ||
					config.tribesFilter.some((t) => g.bgsAvailableTribes?.includes(t)),
			)
			.filter((g) =>
				BG_USE_ANOMALIES
					? !config.anomaliesFilter?.length || config.anomaliesFilter.some((a) => g.bgsAnomalies?.includes(a))
					: true,
			);

		const afterFilter = filterBgsMatchStats(bgGames, config.timeFilter, targetMmr, patchInfo);
		useDebug && console.debug('[bgs-2] rebuilt meta hero stats 2', config, bgGames, afterFilter, tiers);

		const finalStats = tiers?.map((stat) => enhanceHeroStat(stat, afterFilter, this.allCards));
		return {
			stats: finalStats,
			mmrPercentile: { percentile: targetPercentile, mmr: targetMmr },
			lastUpdatedDate: heroStats?.lastUpdateDate ? new Date(heroStats.lastUpdateDate) : null,
		};
	}
}

const extractRank = (
	mmrPercentiles: readonly MmrPercentile[] | null,
	rankFilter: BgsRankFilterType,
	mmrFilter?: number,
): BgsRankFilterType => {
	// Get the highest mmrPercentile whose mmr is lower than mmrFilter, if present
	// If no mmrFilter is present, get the mmrPercentile corresponding to the rankFilter
	if (!mmrPercentiles?.length) {
		return 100;
	}

	if (!mmrFilter) {
		return rankFilter;
	}

	const mmr = mmrPercentiles
		.filter((m) => m.mmr <= mmrFilter)
		.sort((a, b) => a.mmr - b.mmr)
		.pop();
	return mmr?.percentile ?? 100;
};

const extractMmr = (mmrPercentiles: readonly MmrPercentile[] | null, targetPercentile: number, mmrFilter?: number) => {
	if (!mmrPercentiles?.length) {
		return 0;
	}
	if (mmrFilter) {
		return mmrFilter;
	}
	return mmrPercentiles.find((m) => m.percentile === targetPercentile)?.mmr ?? 0;
};
