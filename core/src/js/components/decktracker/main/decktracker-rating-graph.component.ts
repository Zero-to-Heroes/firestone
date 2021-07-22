import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameStat } from '@models/mainwindow/stats/game-stat';
import { AppUiStoreService, cdLog } from '@services/app-ui-store.service';
import { addDaysToDate, arraysEqual, daysBetweenDates, formatDate, groupByFunction } from '@services/utils';
import { ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { DeckRankingCategoryType } from '../../../models/mainwindow/decktracker/deck-ranking-category.type';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { PatchInfo } from '../../../models/patches';
import { DecksStateBuilderService } from '../../../services/decktracker/main/decks-state-builder.service';
import { ladderIntRankToString, ladderRankToInt } from '../../../services/hs-utils';

@Component({
	selector: 'decktracker-rating-graph',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-rating-graph.component.scss`,
	],
	template: `
		<div class="decktracker-rating-graph" *ngIf="value$ | async as value">
			<graph-with-single-value
				[data]="value.data"
				[labels]="value.labels"
				[labelFormattingFn]="value.labelFormattingFn"
				[reverse]="value.reverse"
				emptyStateMessage="Please make sure a unique game mode (Standard, Wild or Classic) is selected above, and check the Bronze / Legend filter."
				emptyStateIcon="assets/svg/ftue/decktracker.svg"
			></graph-with-single-value>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerRatingGraphComponent {
	value$: Observable<Value>;

	constructor(private readonly store: AppUiStoreService) {
		this.value$ = this.store
			.listen$(
				([main, nav]) =>
					main.stats.gameStats.stats
						.filter((stat) => stat.gameMode === 'ranked')
						.filter((stat) => stat.playerRank),
				// TODO: missing a way to select between non-legend and legend graphs
				([main, nav]) => main.decktracker.filters.gameFormat,
				([main, nav]) => main.decktracker.filters.time,
				([main, nav]) => main.decktracker.filters.rankingGroup,
				([main, nav]) => main.decktracker.filters.rankingCategory,
				([main, nav]) => main.decktracker.patch,
			)
			.pipe(
				filter(
					([stats, formatFilter, timeFilter, rakingGroup, rankingCategory, patch]) =>
						!!stats && !!patch?.number,
				),
				distinctUntilChanged((a, b) => this.compare(a, b)),
				map(([stats, formatFilter, timeFilter, rakingGroup, rankingCategory, patch]) =>
					this.buildValue(stats, formatFilter, timeFilter, rakingGroup, rankingCategory, patch),
				),
				tap((values: Value) => cdLog('emitting in ', this.constructor.name, values)),
			);
	}

	private buildValue(
		stats: readonly GameStat[],
		formatFilter: StatGameFormatType,
		timeFilter: DeckTimeFilterType,
		rakingGroup: MmrGroupFilterType,
		rankingCategory: DeckRankingCategoryType,
		patch: PatchInfo,
	): Value {
		if (formatFilter === 'all' || formatFilter === 'unknown') {
			return {
				data: [],
				labels: [],
			};
		}

		const data = [...stats]
			.filter((stat) => stat.gameFormat === formatFilter)
			.filter((stat) => stat.playerRank)
			.filter((stat) =>
				rankingCategory === 'legend'
					? stat.playerRank.includes('legend-')
					: !stat.playerRank.includes('legend-'),
			)
			.reverse();
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
			DecksStateBuilderService.isValidDate(stat, timeFilter, patch),
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
		let values: number[] = [];
		let labels: readonly string[];
		if (rakingGroup === 'per-day') {
			const groupedByDay: { [date: string]: readonly GameStat[] } = groupByFunction((match: GameStat) =>
				formatDate(new Date(match.creationTimestamp)),
			)(finalData);
			const daysSinceStart = daysBetweenDates(
				formatDate(new Date(finalData[0].creationTimestamp)),
				formatDate(new Date(finalData[finalData.length - 1].creationTimestamp)),
			);
			labels = Array.from(Array(daysSinceStart), (_, i) =>
				addDaysToDate(finalData[0].creationTimestamp, i),
			).map((date) => formatDate(date));
			for (const date of labels) {
				const valuesForDay = groupedByDay[date] ?? [];
				let rankForDay = ladderRankToInt(valuesForDay.filter((game) => game.playerRank)[0]?.playerRank);
				if (rankForDay == null) {
					rankForDay = [...values].reverse().filter((value) => value != null)[0];
				}
				values.push(rankForDay);
			}
		} else {
			values = finalData.map((match) => ladderRankToInt(match.playerRank)).filter((rank) => rank != null);
			labels = Array.from(Array(values.length), (_, i) => i + 1).map((matchIndex) => '' + matchIndex);
		}
		return {
			data: [
				{
					data: values,
					label: 'Rating',
					fill: rankingCategory === 'legend' ? 'start' : 'origin',
				},
			],
			labels: labels,
			labelFormattingFn: (label, index, labels) => {
				if (!label) {
					return label;
				}

				return ladderIntRankToString(+label, rankingCategory === 'legend');
			},
			reverse: rankingCategory === 'legend',
		} as Value;
	}

	private compare(
		a: [GameStat[], StatGameFormatType, DeckTimeFilterType, MmrGroupFilterType, DeckRankingCategoryType, PatchInfo],
		b: [GameStat[], StatGameFormatType, DeckTimeFilterType, MmrGroupFilterType, DeckRankingCategoryType, PatchInfo],
	): boolean {
		if (a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3] || a[4] !== b[4] || a[5]?.number !== b[5]?.number) {
			return false;
		}
		return arraysEqual(a[0], b[0]);
	}
}

interface Value {
	readonly data: ChartDataSets[];
	readonly labels: Label;
	readonly labelFormattingFn?: (label: string, index: number, labels: string[]) => string;
	readonly reverse?: boolean;
}
