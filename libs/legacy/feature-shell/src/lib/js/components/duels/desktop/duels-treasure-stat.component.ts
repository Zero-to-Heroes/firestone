import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsTreasureStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { filterDuelsTreasureStats } from '@firestone/duels/data-access';
import { DuelsHeroSortFilterType, DuelsMetaStats } from '@firestone/duels/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
import { DuelsRun } from '../../../models/duels/duels-run';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { buildDuelsHeroTreasurePlayerStats, filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'duels-treasure-stats',
	styleUrls: [`../../../../css/component/duels/desktop/duels-treasure-stats.component.scss`],
	template: `
		<div *ngIf="stats$ | async as stats; else emptyState" class="duels-treasure-stats" scrollable>
			<duels-meta-stats-view
				[stats]="stats"
				[sort]="sort$ | async"
				[hideLowData]="hideLowData$ | async"
			></duels-meta-stats-view>
		</div>
		<ng-template #emptyState>
			<duels-empty-state></duels-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	stats$: Observable<readonly DuelsMetaStats[]>;
	sort$: Observable<DuelsHeroSortFilterType>;
	hideLowData$: Observable<boolean>;

	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		const rawStats$ = combineLatest([
			this.store.duelsRuns$(),
			this.store.listen$(
				([main, nav]) => main.duels?.globalStats?.treasures,
				([main, nav]) => main.duels?.globalStats?.mmrPercentiles,
				([main, nav]) => nav.navigationDuels.treasureSearchString,
				([main, nav, prefs]) => prefs.duelsActiveTreasureStatTypeFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter2,
				([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter2,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => main.duels?.currentDuelsMetaPatch,
			),
		]).pipe(
			this.mapData(
				([
					runs,
					[
						duelStats,
						mmrPercentiles,
						treasureSearchString,
						statType,
						gameMode,
						timeFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						mmrFilter,
						patch,
					],
				]) =>
					[
						filterDuelsTreasureStats(
							duelStats,
							classFilter,
							heroPowerFilter,
							sigTreasureFilter,
							statType,
							this.allCards,
							treasureSearchString,
						),
						filterDuelsRuns(
							runs,
							timeFilter,
							classFilter,
							gameMode,
							null,
							patch,
							0,
							heroPowerFilter,
							sigTreasureFilter,
						),
					] as [readonly DuelsTreasureStat[], readonly DuelsRun[]],
			),
			this.mapData(([duelStats, duelsRuns]) => buildDuelsHeroTreasurePlayerStats(duelStats, duelsRuns)),
		);

		this.stats$ = rawStats$.pipe(
			this.mapData((stats) => {
				const tieredStats = stats.map((stat) => {
					const card = this.allCards.getCard(stat.cardId);
					const result: DuelsMetaStats = {
						cardId: stat.cardId,
						cardName: card.name,
						globalRunsPlayed: stat.globalTotalMatches,
						globalPopularity: stat.globalPopularity,
						globalWinrate: stat.globalWinrate,
						placementDistribution: stat.globalWinDistribution.map((info) => ({
							wins: info.winNumber,
							percentage: info.value,
							runs: Math.round(info.value * stat.globalTotalMatches),
						})),
						playerRunsPlayed: stat.playerTotalMatches,
						playerWinrate: stat.playerWinrate,
					};
					return result;
				});
				console.debug('tieredStats', tieredStats);
				return tieredStats;
			}),
		);
		this.sort$ = this.listenForBasicPref$((prefs) => prefs.duelsActiveHeroSortFilter);
		this.hideLowData$ = this.listenForBasicPref$((prefs) => prefs.duelsHideStatsBelowThreshold);
	}

	private sortBy(heroSorting: DuelsHeroSortFilterType): (a: DuelsHeroPlayerStat, b: DuelsHeroPlayerStat) => number {
		switch (heroSorting) {
			case 'games-played':
				return (a, b) => b.playerTotalMatches - a.playerTotalMatches;
			case 'global-winrate':
				return (a, b) => b.globalWinrate - a.globalWinrate;
			case 'player-winrate':
				return (a, b) => b.playerWinrate - a.playerWinrate;
		}
	}
}
