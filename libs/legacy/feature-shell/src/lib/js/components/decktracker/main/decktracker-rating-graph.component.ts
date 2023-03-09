import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { GameStat, StatGameFormatType } from '@firestone/stats/data-access';
import { addDaysToDate, arraysEqual, daysBetweenDates, formatDate, groupByFunction } from '@services/utils';
import { ChartData } from 'chart.js';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { DeckRankingCategoryType } from '../../../models/mainwindow/decktracker/deck-ranking-category.type';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { PatchInfo } from '../../../models/patches';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { ladderIntRankToString, ladderRankToInt } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-rating-graph',
	styleUrls: [`../../../../css/component/decktracker/main/decktracker-rating-graph.component.scss`],
	template: `
		<div class="decktracker-rating-graph" *ngIf="value$ | async as value">
			<ng-container *ngIf="regionSelected$ | async; else emptyState">
				<graph-with-single-value
					[data]="value.data"
					[labelFormattingFn]="value.labelFormattingFn"
					[reverse]="value.reverse"
					[emptyStateMessage]="'app.decktracker.rating-graph.empty-state-message' | owTranslate"
					emptyStateIcon="assets/svg/ftue/decktracker.svg"
				></graph-with-single-value>
			</ng-container>
			<ng-template #emptyState>
				<battlegrounds-empty-state
					class="empty-state"
					emptyStateIcon="assets/svg/ftue/decktracker.svg"
					[title]="'app.decktracker.rating-graph.missing-region-title' | owTranslate"
					[subtitle]="''"
				></battlegrounds-empty-state>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerRatingGraphComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	value$: Observable<Value>;
	regionSelected$: Observable<boolean>;

	constructor(
		private i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		// Force a region select only if multiple regions are available in the stats
		this.regionSelected$ = combineLatest(
			this.store.gameStats$(),
			this.store.listenPrefs$((prefs) => prefs.regionFilter),
		).pipe(
			this.mapData(
				([gameStats, [region]]) =>
					// Don't filter for only ranked games, so that the user can clearly understand what they are seeing

					[...new Set(gameStats.filter((s) => !!s.region).map((s) => s.region))].length === 1 ||
					(!!region && region !== 'all'),
			),
		);
		this.value$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav]) => main.decktracker.filters.gameFormat,
				([main, nav]) => main.decktracker.filters.time,
				([main, nav]) => main.decktracker.filters.rankingGroup,
				([main, nav]) => main.decktracker.filters.rankingCategory,
				([main, nav]) => main.decktracker.patch,
			),
		).pipe(
			map(
				([stats, [gameFormat, time, rankingGroup, rankingCategory, patch]]) =>
					[
						stats.filter((stat) => stat.gameMode === 'ranked').filter((stat) => stat.playerRank),
						gameFormat,
						time,
						rankingGroup,
						rankingCategory,
						patch,
					] as [
						GameStat[],
						StatGameFormatType,
						DeckTimeFilterType,
						MmrGroupFilterType,
						DeckRankingCategoryType,
						PatchInfo,
					],
			),
			filter(
				([stats, formatFilter, timeFilter, rakingGroup, rankingCategory, patch]) => !!stats && !!patch?.number,
			),
			distinctUntilChanged((a, b) => this.compare(a, b)),
			this.mapData(([stats, formatFilter, timeFilter, rakingGroup, rankingCategory, patch]) =>
				this.buildValue(stats, formatFilter, timeFilter, rakingGroup, rankingCategory, patch),
			),
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
				data: {
					datasets: [],
					labels: [],
				},
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
				data: {
					datasets: [],
					labels: [],
				},
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
			DecksProviderService.isValidDate(stat, timeFilter, patch),
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
				new Date(match.creationTimestamp).toLocaleDateString(this.i18n.formatCurrentLocale(), {
					day: '2-digit',
					month: '2-digit',
					year: '2-digit',
				}),
			)(finalData);
			const daysSinceStart = daysBetweenDates(
				formatDate(new Date(finalData[0].creationTimestamp)),
				formatDate(new Date(finalData[finalData.length - 1].creationTimestamp)),
			);
			labels = Array.from(Array(daysSinceStart), (_, i) => addDaysToDate(finalData[0].creationTimestamp, i)).map(
				(date) =>
					date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
						day: '2-digit',
						month: '2-digit',
						year: '2-digit',
					}),
			);
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
			data: {
				datasets: [
					{
						data: values,
						label: 'Rating',
						fill: rankingCategory === 'legend' ? 'start' : 'origin',
					},
				],
				labels: labels,
			},
			labelFormattingFn: (label, index) => {
				if (!label) {
					return label;
				}

				return ladderIntRankToString(+label, rankingCategory === 'legend', this.i18n);
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
	readonly data: ChartData<'line'>;
	readonly labelFormattingFn?: (label: string, index: number) => string;
	readonly reverse?: boolean;
}
