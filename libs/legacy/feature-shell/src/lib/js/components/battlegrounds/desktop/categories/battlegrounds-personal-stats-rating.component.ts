import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { PatchInfo, PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { GameStatsProviderService } from '@legacy-import/src/lib/js/services/stats/game/game-stats-provider.service';
import { ChartData } from 'chart.js';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { isBattlegrounds } from '../../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { addDaysToDate, daysBetweenDates, formatDate, groupByFunction } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-personal-stats-rating',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-rating" *ngIf="value$ | async as value">
			<ng-container *ngIf="regionSelected$ | async; else emptyState">
				<div class="header" [owTranslate]="'app.battlegrounds.personal-stats.rating.title'"></div>
				<graph-with-single-value
					[data]="value"
					[emptyStateMessage]="'app.battlegrounds.personal-stats.rating.empty-state-message' | owTranslate"
					[beginAtZero]="false"
					[reverse]="false"
				></graph-with-single-value>
			</ng-container>
			<ng-template #emptyState>
				<battlegrounds-empty-state
					class="empty-state"
					[title]="'app.decktracker.rating-graph.missing-region-title' | owTranslate"
					[subtitle]="''"
				></battlegrounds-empty-state>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsRatingComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	value$: Observable<ChartData<'line'>>;
	regionSelected$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly prefs: PreferencesService,
		private readonly gameStats: GameStatsProviderService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.prefs, this.gameStats);

		// Force a region select only if multiple regions are available in the stats
		this.regionSelected$ = combineLatest([
			this.gameStats.gameStats$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.regionFilter)),
		]).pipe(
			this.mapData(
				([gameStats, region]) =>
					// Don't filter for only ranked games, so that the user can clearly understand what they are seeing
					[...new Set(gameStats.filter((s) => !!s.region).map((s) => s.region))].length === 1 ||
					(!!region && region !== 'all'),
			),
		);
		this.value$ = combineLatest([
			this.gameStats.gameStats$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						timeFilter: prefs.bgsActiveTimeFilter,
						mmrFilter: prefs.bgsActiveRankFilter,
						mmrGroupFilter: prefs.bgsActiveMmrGroupFilter,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
			this.patchesConfig.currentBattlegroundsMetaPatch$$,
		]).pipe(
			filter(
				([stats, { timeFilter, mmrFilter, mmrGroupFilter }, currentBattlegroundsMetaPatch]) =>
					!!stats && !!currentBattlegroundsMetaPatch,
			),
			this.mapData(([stats, { timeFilter, mmrFilter, mmrGroupFilter }, currentBattlegroundsMetaPatch]) => {
				const relevantGames = stats
					.filter((stat) => isBattlegrounds(stat.gameMode))
					.filter((stat) => stat.playerRank);
				return this.buildValue(
					relevantGames,
					timeFilter,
					mmrFilter,
					mmrGroupFilter,
					currentBattlegroundsMetaPatch,
				);
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildValue(
		stats: readonly GameStat[],
		timeFilter: BgsActiveTimeFilterType,
		mmrFilter: number,
		mmrGroupFilter: MmrGroupFilterType,
		currentBattlegroundsMetaPatch: PatchInfo,
	): ChartData<'line'> {
		const data = [...stats].filter((stat) => +stat.playerRank >= mmrFilter).reverse();
		if (!data.length) {
			return {
				datasets: [],
				labels: [],
			};
		}
		const fakeMatchWithCurrentMmr: GameStat = data[data.length - 1].newPlayerRank
			? GameStat.create({
					...data[data.length - 1],
					playerRank: data[data.length - 1].newPlayerRank,
			  } as GameStat)
			: null;
		const dataWithCurrentMmr = fakeMatchWithCurrentMmr ? [...data, fakeMatchWithCurrentMmr] : data;
		const dataWithTime = dataWithCurrentMmr.filter((stat) =>
			this.timeFilter(stat, timeFilter, currentBattlegroundsMetaPatch),
		);
		if (mmrGroupFilter === 'per-day') {
			const groupedByDay: { [date: string]: readonly GameStat[] } = groupByFunction((match: GameStat) =>
				formatDate(new Date(match.creationTimestamp)),
			)(dataWithTime);
			const daysSinceStart = daysBetweenDates(
				formatDate(new Date(dataWithTime[0].creationTimestamp)),
				formatDate(new Date(dataWithTime[dataWithTime.length - 1].creationTimestamp)),
			);
			const labels = Array.from(Array(daysSinceStart), (_, i) =>
				addDaysToDate(dataWithTime[0].creationTimestamp, i),
			).map((date) => formatDate(date));
			const values = [];
			for (const date of labels) {
				const valuesForDay = groupedByDay[date] ?? [];
				let rankForDay = parseInt(valuesForDay[0]?.playerRank);
				if (rankForDay == null || isNaN(rankForDay)) {
					rankForDay = [...values].reverse().filter((value) => value != null)[0];
				}
				values.push(rankForDay);
			}
			return {
				datasets: [
					{
						data: values,
						label: this.i18n.translateString('app.battlegrounds.personal-stats.rating.axis-label'),
					},
				],
				labels: labels,
			};
		} else {
			const data = dataWithTime.map((match) => parseInt(match.playerRank));
			return {
				datasets: [
					{
						data: data,
						label: this.i18n.translateString('app.battlegrounds.personal-stats.rating.axis-label'),
					},
				],
				labels: Array.from(Array(data.length), (_, i) => i + 1).map((matchIndex) => '' + matchIndex),
			};
		}
	}

	private timeFilter(stat: GameStat, timeFilter: BgsActiveTimeFilterType, patch: PatchInfo): boolean {
		if (!timeFilter) {
			return true;
		}

		switch (timeFilter) {
			case 'last-patch':
				// See bgs-ui-helper
				return (
					stat.buildNumber >= patch.number ||
					stat.creationTimestamp > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000
				);
			case 'past-three':
				return Date.now() - stat.creationTimestamp <= 3 * 24 * 60 * 60 * 1000;
			case 'past-seven':
				return Date.now() - stat.creationTimestamp <= 7 * 24 * 60 * 60 * 1000;
			case 'all-time':
			default:
				return true; //Date.now() - stat.creationTimestamp <= 30 * 24 * 60 * 60 * 1000;
		}
	}
}
