import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsActiveTimeFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../../models/patches';
import { isBattlegrounds } from '../../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { addDaysToDate, daysBetweenDates, formatDate, groupByFunction } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-personal-stats-rating',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-rating" *ngIf="value$ | async as value">
			<ng-container *ngIf="regionSelected$ | async; else emptyState">
				<div class="header" [owTranslate]="'app.battlegrounds.personal-stats.rating.title'"></div>
				<graph-with-single-value
					[data]="value.data"
					[labels]="value.labels"
					[emptyStateMessage]="'app.battlegrounds.personal-stats.rating.empty-state-message' | owTranslate"
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
	implements AfterContentInit {
	value$: Observable<Value>;
	regionSelected$: Observable<boolean>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		// Force a region select only if multiple regions are available in the stats
		this.regionSelected$ = combineLatest(
			this.store.gameStats$(),
			this.store.listenPrefs$((prefs) => prefs.regionFilter),
		).pipe(
			this.mapData(
				([gameStats, [region]]) =>
					// Don't filter for only ranked games, so that the user can clearly understand what they are seeing
					[...new Set(gameStats.map((s) => s.region))].length === 1 || (!!region && region !== 'all'),
			),
		);
		this.value$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveMmrGroupFilter,
				([main, nav]) => main.battlegrounds.currentBattlegroundsMetaPatch,
			),
		).pipe(
			filter(
				([stats, [timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]]) =>
					!!stats && !!currentBattlegroundsMetaPatch,
			),
			this.mapData(([stats, [timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]]) => {
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
	}

	private buildValue(
		stats: readonly GameStat[],
		timeFilter: BgsActiveTimeFilterType,
		mmrFilter: number,
		mmrGroupFilter: MmrGroupFilterType,
		currentBattlegroundsMetaPatch: PatchInfo,
	): Value {
		const data = [...stats].filter((stat) => +stat.playerRank >= mmrFilter).reverse();
		if (!data.length) {
			return {
				data: [],
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
				data: [
					{
						data: values,
						label: this.i18n.translateString('app.battlegrounds.personal-stats.rating.axis-label'),
					},
				],
				labels: labels,
			} as Value;
		} else {
			const data = dataWithTime.map((match) => parseInt(match.playerRank));
			return {
				data: [
					{
						data: data,
						label: this.i18n.translateString('app.battlegrounds.personal-stats.rating.axis-label'),
					},
				],
				labels: Array.from(Array(data.length), (_, i) => i + 1).map((matchIndex) => '' + matchIndex),
			} as Value;
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

interface Value {
	readonly data: ChartDataSets[];
	readonly labels: Label;
}
