import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { GameStat } from '@firestone/stats/data-access';
import { addDaysToDate, daysBetweenDates, formatDate, groupByFunction } from '@services/utils';
import { ChartData } from 'chart.js';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StatsXpGraphSeasonFilterType } from '../../../models/mainwindow/stats/stats-xp-graph-season-filter.type';
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
} from '../../../services/stats/xp/xp-tables/xp-computation';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
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
export class StatsXpGraphComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	value$: Observable<Value>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.value$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(([main, nav]) => main.stats.filters.xpGraphSeasonFilter),
		).pipe(
			filter(([stats, seasonFilter]) => !!seasonFilter),
			this.mapData(([stats, [seasonFilter]]) =>
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
		switch (seasonFilter) {
			case 'season-1':
				return getSeason(stat.creationTimestamp) === xpSeason1;
			case 'season-2':
				return getSeason(stat.creationTimestamp) === xpSeason2;
			case 'season-3':
				return getSeason(stat.creationTimestamp) === xpSeason3;
			case 'season-4':
				return getSeason(stat.creationTimestamp) === xpSeason4;
			case 'season-5':
				return getSeason(stat.creationTimestamp) === xpSeason5;
			case 'season-6':
				return getSeason(stat.creationTimestamp) === xpSeason6;
			case 'season-7':
				return getSeason(stat.creationTimestamp) === xpSeason7;
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
