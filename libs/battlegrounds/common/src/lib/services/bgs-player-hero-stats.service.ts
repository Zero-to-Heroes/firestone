/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import { BgsMetaHeroStatTierItem, enhanceHeroStat } from '@firestone/battlegrounds/data-access';
import { PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, deepEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { GAME_STATS_PROVIDER_SERVICE_TOKEN, IGameStatsProviderService } from '@firestone/stats/common';
import { combineLatest, distinctUntilChanged, map, tap } from 'rxjs';
import { BG_USE_ANOMALIES, BgsMetaHeroStatsService } from './bgs-meta-hero-stats.service';
import { filterBgsMatchStats } from './hero-stats-helper';

@Injectable()
export class BgsPlayerHeroStatsService extends AbstractFacadeService<BgsPlayerHeroStatsService> {
	public tiersWithPlayerData$$: SubscriberAwareBehaviorSubject<readonly BgsMetaHeroStatTierItem[] | null | undefined>;

	private metaStats: BgsMetaHeroStatsService;
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
		this.prefs = AppInjector.get(PreferencesService);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.gameStats = AppInjector.get(GAME_STATS_PROVIDER_SERVICE_TOKEN);
		this.patchesConfig = AppInjector.get(PatchesConfigService);

		await waitForReady(this.patchesConfig, this.metaStats, this.prefs);

		this.tiersWithPlayerData$$.onFirstSubscribe(() => {
			const playerBgGames$ = combineLatest([
				this.gameStats.gameStats$$,
				this.metaStats.metaHeroStats$$.pipe(
					map((stats) => stats?.mmrPercentiles ?? []),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				),
				this.patchesConfig.currentBattlegroundsMetaPatch$$,
				this.prefs.preferences$$.pipe(
					map((prefs) => ({
						rankFilter: prefs.bgsActiveRankFilter,
						tribesFilter: prefs.bgsActiveTribesFilter,
						anomaliesFilter: prefs.bgsActiveAnomaliesFilter,
						timeFilter: prefs.bgsActiveTimeFilter,
						useMmrFilter: prefs.bgsActiveUseMmrFilterInHeroSelection,
						useAnomalyFilter: prefs.bgsActiveUseAnomalyFilterInHeroSelection,
					})),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				),
			]).pipe(
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				map(
					([
						games,
						mmrPercentiles,
						patchInfo,
						{ rankFilter, tribesFilter, anomaliesFilter, timeFilter, useMmrFilter, useAnomalyFilter },
					]) => {
						const targetRank: number =
							!mmrPercentiles?.length || !rankFilter || !useMmrFilter
								? 0
								: mmrPercentiles.find((m) => m.percentile === rankFilter)?.mmr ?? 0;
						const bgGames = (games ?? [])
							.filter((g) => ['battlegrounds', 'battlegrounds-friendly'].includes(g.gameMode))
							.filter(
								(g) =>
									!tribesFilter?.length ||
									tribesFilter.length === ALL_BG_RACES.length ||
									tribesFilter.some((t) => g.bgsAvailableTribes?.includes(t)),
							)
							.filter((g) =>
								BG_USE_ANOMALIES
									? !anomaliesFilter?.length ||
									  !useAnomalyFilter ||
									  anomaliesFilter.some((a) => g.bgsAnomalies?.includes(a))
									: true,
							);
						const afterFilter = filterBgsMatchStats(bgGames, timeFilter, targetRank, patchInfo);
						console.debug(
							'[bgs-2] rebuilding meta hero stats 2',
							bgGames,
							afterFilter,
							anomaliesFilter,
							useAnomalyFilter,
						);
						return afterFilter;
					},
				),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			);

			combineLatest([this.metaStats.tiers$$, playerBgGames$])
				.pipe(
					tap((info) => console.debug('[bgs-3] rebuilding meta hero stats 3', info)),
					map(([stats, playerBgGames]) =>
						stats?.map((stat) => enhanceHeroStat(stat, playerBgGames, this.allCards)),
					),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				)
				.subscribe(this.tiersWithPlayerData$$);
		});
	}
}
