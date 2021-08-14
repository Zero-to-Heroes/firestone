import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsActiveTimeFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsRankFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { addDaysToDate, arraysEqual, daysBetweenDates, formatDate, groupByFunction } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-personal-stats-rating',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-rating" *ngIf="value$ | async as value">
			<div class="header">MMR / Matches</div>
			<graph-with-single-value
				[data]="value.data"
				[labels]="value.labels"
				emptyStateMessage="Start playing Battlegrounds to collect some information"
			></graph-with-single-value>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsRatingComponent {
	value$: Observable<Value>;

	constructor(private readonly store: AppUiStoreService) {
		this.value$ = this.store
			.listen$(
				([main, nav]) => main.stats.gameStats.stats,
				([main, nav]) => main.battlegrounds.activeTimeFilter,
				([main, nav]) => main.battlegrounds.activeRankFilter,
				([main, nav]) => main.battlegrounds.activeGroupMmrFilter,
				([main, nav]) => main.battlegrounds.globalStats.currentBattlegroundsMetaPatch?.number,
			)
			.pipe(
				filter(
					([stats, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]) =>
						!!stats && !!currentBattlegroundsMetaPatch,
				),
				map(
					([stats, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]) =>
						[
							stats.filter((stat) => stat.gameMode === 'battlegrounds').filter((stat) => stat.playerRank),
							timeFilter,
							mmrFilter,
							mmrGroupFilter,
							currentBattlegroundsMetaPatch,
						] as [GameStat[], BgsActiveTimeFilterType, BgsRankFilterType, MmrGroupFilterType, number],
				),
				distinctUntilChanged((a, b) => this.compare(a, b)),
				map(([stats, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]) =>
					this.buildValue(stats, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch),
				),
				tap((values: Value) => cdLog('emitting in ', this.constructor.name, values)),
			);
	}

	private buildValue(
		stats: readonly GameStat[],
		timeFilter: BgsActiveTimeFilterType,
		mmrFilter: BgsRankFilterType,
		mmrGroupFilter: MmrGroupFilterType,
		currentBattlegroundsMetaPatch: number,
	): Value {
		const data = [...stats].filter((stat) => this.isCorrectMmr(stat.playerRank, mmrFilter)).reverse();
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
		// Remove the first match if we're on a "last patch" filter
		const finalData =
			timeFilter === 'last-patch'
				? [
						GameStat.create({
							...dataWithTime[0],
							playerRank: '0',
						} as GameStat),
						...dataWithTime.slice(1),
				  ]
				: dataWithTime;
		if (mmrGroupFilter === 'per-day') {
			const groupedByDay: { [date: string]: readonly GameStat[] } = groupByFunction((match: GameStat) =>
				formatDate(new Date(match.creationTimestamp)),
			)(finalData);
			const daysSinceStart = daysBetweenDates(
				formatDate(new Date(finalData[0].creationTimestamp)),
				formatDate(new Date(finalData[finalData.length - 1].creationTimestamp)),
			);
			const labels = Array.from(Array(daysSinceStart), (_, i) =>
				addDaysToDate(finalData[0].creationTimestamp, i),
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
						label: 'Rating',
					},
				],
				labels: labels,
			} as Value;
		} else {
			const data = finalData.map((match) => parseInt(match.playerRank));
			return {
				data: [
					{
						data: data,
						label: 'Rating',
					},
				],
				labels: Array.from(Array(data.length), (_, i) => i + 1).map((matchIndex) => '' + matchIndex),
			} as Value;
		}
	}

	private isCorrectMmr(playerRank: string, mmrFilter: BgsRankFilterType): boolean {
		switch (mmrFilter) {
			case 'all':
				return true;
			default:
				return +playerRank >= +mmrFilter;
		}
	}

	private timeFilter(stat: GameStat, timeFilter: string, currentBattlegroundsMetaPatch: number): boolean {
		if (!timeFilter) {
			return true;
		}

		switch (timeFilter) {
			case 'last-patch':
				return stat.buildNumber >= currentBattlegroundsMetaPatch;
			case 'past-30':
				return Date.now() - stat.creationTimestamp <= 30 * 24 * 60 * 60 * 1000;
			case 'past-7':
				return Date.now() - stat.creationTimestamp <= 7 * 24 * 60 * 60 * 1000;
			case 'all-time':
			default:
				return true;
		}
	}

	private compare(
		a: [GameStat[], BgsActiveTimeFilterType, BgsRankFilterType, MmrGroupFilterType, number],
		b: [GameStat[], BgsActiveTimeFilterType, BgsRankFilterType, MmrGroupFilterType, number],
	): boolean {
		if (a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3] || a[4] !== b[4]) {
			return false;
		}
		return arraysEqual(a[0], b[0]);
	}
}

interface Value {
	readonly data: ChartDataSets[];
	readonly labels: Label;
}
