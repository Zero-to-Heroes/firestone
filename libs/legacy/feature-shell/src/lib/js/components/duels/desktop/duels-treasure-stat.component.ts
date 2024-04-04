import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { DuelsTreasureStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { filterDuelsTreasureStats } from '@firestone/duels/data-access';
import { DuelsNavigationService, DuelsRun } from '@firestone/duels/general';
import { DuelsHeroSortFilterType, DuelsMetaStats } from '@firestone/duels/view';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { DuelsDecksProviderService } from '../../../services/duels/duels-decks-provider.service';
import { DuelsMetaStatsService } from '../../../services/duels/duels-meta-stats.service';
import { PatchesConfigService } from '../../../services/patches-config.service';
import { buildDuelsHeroTreasurePlayerStats, filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';

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
export class DuelsTreasureStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly DuelsMetaStats[]>;
	sort$: Observable<DuelsHeroSortFilterType>;
	hideLowData$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly duelsDecks: DuelsDecksProviderService,
		private readonly duelsMetaStats: DuelsMetaStatsService,
		private readonly nav: DuelsNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([
			this.patchesConfig.isReady(),
			this.duelsDecks.isReady(),
			this.duelsMetaStats.isReady(),
			this.nav.isReady(),
			this.prefs.isReady(),
		]);

		const rawStats$ = combineLatest([
			this.duelsDecks.duelsRuns$$,
			this.duelsMetaStats.duelsMetaStats$$,
			this.nav.heroSearchString$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						statType: prefs.duelsActiveTreasureStatTypeFilter,
						gameMode: prefs.duelsActiveGameModeFilter,
						timeFilter: prefs.duelsActiveTimeFilter,
						classFilter: prefs.duelsActiveHeroesFilter2,
						heroPowerFilter: prefs.duelsActiveHeroPowerFilter2,
						sigTreasureFilter: prefs.duelsActiveSignatureTreasureFilter2,
						mmrFilter: prefs.duelsActiveMmrFilter,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			this.mapData(
				([
					runs,
					duelMetaStats,
					treasureSearchString,
					{
						// mmrPercentiles,
						statType,
						gameMode,
						timeFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						mmrFilter,
					},
					patch,
				]) =>
					[
						filterDuelsTreasureStats(
							duelMetaStats?.treasures,
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
		this.sort$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsActiveHeroSortFilter));
		this.hideLowData$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsHideStatsBelowThreshold));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onStatsClicked(stat: DuelsMetaStats) {
		console.debug('stats clicked', stat);
		// this.store.send(new DuelsExploreDecksEvent(null, null, stat.cardId));
	}
}
