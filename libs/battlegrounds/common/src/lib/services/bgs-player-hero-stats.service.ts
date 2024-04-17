/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
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
import {
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	map,
	shareReplay,
	switchMap,
	tap,
	withLatestFrom,
} from 'rxjs';
import { BgsMetaHeroStatsDuoService } from './bgs-meta-hero-stats-duo.service';
import { BG_USE_ANOMALIES, BgsMetaHeroStatsService } from './bgs-meta-hero-stats.service';
import { filterBgsMatchStats } from './hero-stats-helper';

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

			// Get the correct observable based on the gameMode$
			const heroStats$: Observable<BgsHeroStatsV2 | null> = gameMode$.pipe(
				distinctUntilChanged(),
				switchMap((gameMode) =>
					gameMode === 'battlegrounds-duo'
						? this.metaStatsDuo.metaHeroStats$$
						: this.metaStats.metaHeroStats$$,
				),
			);
			const tiers$: Observable<readonly BgsMetaHeroStatTierItem[] | null> = gameMode$.pipe(
				distinctUntilChanged(),
				switchMap((gameMode) =>
					gameMode === 'battlegrounds-duo' ? this.metaStatsDuo.tiers$$ : this.metaStats.tiers$$,
				),
			);

			// Can probably avoid marking the data as null when changing things like the tribes
			const config$ = combineLatest([
				gameMode$,
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
				map(([gameMode, config]) => ({
					...config,
					gameMode: gameMode,
				})),
				shareReplay(1),
			);
			config$.subscribe(() => this.tiersWithPlayerData$$.next(null));

			const playerBgGames$ = combineLatest([
				this.gameStats.gameStats$$,
				this.patchesConfig.currentBattlegroundsMetaPatch$$,
				config$,
			]).pipe(
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				withLatestFrom(
					heroStats$.pipe(
						map((stats) => stats?.mmrPercentiles ?? []),
						distinctUntilChanged((a, b) => deepEqual(a, b)),
					),
				),
				map(
					([
						[
							games,
							patchInfo,
							{
								rankFilter,
								tribesFilter,
								anomaliesFilter,
								timeFilter,
								useMmrFilter,
								useAnomalyFilter,
								gameMode,
							},
						],
						mmrPercentiles,
					]) => {
						const targetRank: number =
							!mmrPercentiles?.length || !rankFilter || !useMmrFilter
								? 0
								: mmrPercentiles.find((m) => m.percentile === rankFilter)?.mmr ?? 0;
						// #Duos: add support for BG duos in player hero stats
						const bgGames = (games ?? [])
							.filter((g) =>
								gameMode === 'battlegrounds'
									? ['battlegrounds', 'battlegrounds-friendly'].includes(g.gameMode)
									: ['battlegrounds-duo'].includes(g.gameMode),
							)
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

			combineLatest([tiers$, playerBgGames$])
				.pipe(
					debounceTime(200),
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
