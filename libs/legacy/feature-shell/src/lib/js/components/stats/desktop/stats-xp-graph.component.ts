import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { StatsXpGraphSeasonFilterType } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { GameStatsProviderService } from '@firestone/stats/services';
import { addDaysToDate, daysBetweenDates, formatDate, groupByFunction } from '@services/utils';
import { ChartData } from 'chart.js';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
	computeXpFromLevel,
	getSeason,
	xpSeason1,
	xpSeason2,
	xpSeason3,
	xpSeason4,
	xpSeason5,
	xpSeason6,
	xpSeason7,
	xpSeason8,
	xpSeason9,
} from '../../../services/stats/xp/xp-tables/xp-computation';

@Component({
	standalone: false,
	selector: 'stats-xp-graph',
	styleUrls: [`../../../../css/component/stats/desktop/stats-xp-graph.component.scss`],
	template: `
		<div class="stats-xp-graph" *ngIf="value$ | async as value">
			<graph-with-single-value
				[data]="value.data"
				emptyStateMessage="No data available for this season"
			></graph-with-single-value>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsXpGraphComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	value$: Observable<Value>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly mainWindowState: MainWindowStateFacadeService,
		private readonly gameStats: GameStatsProviderService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mainWindowState, this.gameStats);

		this.value$ = combineLatest([
			this.gameStats.gameStats$$,
			this.mainWindowState.mainWindowState$$.pipe(
				this.mapData((state) => state.stats.filters.xpGraphSeasonFilter),
			),
		]).pipe(
			filter(([stats, seasonFilter]) => !!seasonFilter),
			this.mapData(([stats, seasonFilter]) =>
				this.buildValue(
					stats.filter((stat) => stat.levelAfterMatch),
					seasonFilter,
				),
			),
		);
	}

	private buildValue(stats: readonly GameStat[], seasonFilter: StatsXpGraphSeasonFilterType): Value {
		const data = [...stats].reverse();
		const dataWithTime = data.filter((stat) => this.isValidDate(stat, seasonFilter));
		console.debug('buildValue', stats, seasonFilter, dataWithTime);
		if (!dataWithTime?.length) {
			return {
				data: {
					datasets: [],
					labels: [],
				},
			};
		}

		const values: number[] = [];
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
		for (const date of labels) {
			const valuesForDay = groupedByDay[date] ?? [];
			const firstGameOfDay = valuesForDay[0];
			const xpForDay = firstGameOfDay
				? computeXpFromLevel(firstGameOfDay.levelAfterMatch, firstGameOfDay.creationTimestamp)
				: 0;
			const previousDayXp = !!values?.length ? values[values.length - 1] : 0;
			values.push(previousDayXp + xpForDay);
		}
		console.debug('result', values);
		return {
			data: {
				datasets: [
					{
						data: values,
						label: 'Rating',
					},
				],
				labels: labels,
			},
		} as Value;
	}

	private isValidDate(stat: GameStat, seasonFilter: StatsXpGraphSeasonFilterType): boolean {
		const statSeason = getSeason(stat.creationTimestamp);
		// console.debug('stat season for', stat, 'is', statSeason);
		switch (seasonFilter) {
			case 'season-1':
				return statSeason === xpSeason1;
			case 'season-2':
				return statSeason === xpSeason2;
			case 'season-3':
				return statSeason === xpSeason3;
			case 'season-4':
				return statSeason === xpSeason4;
			case 'season-5':
				return statSeason === xpSeason5;
			case 'season-6':
				return statSeason === xpSeason6;
			case 'season-7':
				return statSeason === xpSeason7;
			case 'season-8':
				return statSeason === xpSeason8;
			case 'season-9':
				return statSeason === xpSeason9;
			case 'all-seasons':
			default:
				return true;
		}
	}
}

interface Value {
	readonly data: ChartData<'line'>;
	readonly labelFormattingFn?: (label: string, index: number, labels: string[]) => string;
	readonly reverse?: boolean;
}
