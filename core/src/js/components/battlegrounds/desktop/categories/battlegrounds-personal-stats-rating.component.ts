import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsActiveTimeFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../../models/patches';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { getMmrThreshold } from '../../../../services/ui-store/bgs-ui-helper';
import { addDaysToDate, arraysEqual, daysBetweenDates, formatDate, groupByFunction } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-personal-stats-rating',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-rating" *ngIf="value$ | async as value">
			<div class="header" [owTranslate]="'app.battlegrounds.personal-stats.rating.title'"></div>
			<graph-with-single-value
				[data]="value.data"
				[labels]="value.labels"
				[emptyStateMessage]="'app.battlegrounds.personal-stats.rating.empty-state-message' | owTranslate"
			></graph-with-single-value>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsRatingComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	value$: Observable<Value>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.value$ = this.store
			.listen$(
				([main, nav]) => main.stats.gameStats.stats,
				([main, nav]) => main.battlegrounds.globalStats.mmrPercentiles,
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveMmrGroupFilter,
				([main, nav]) => main.battlegrounds.currentBattlegroundsMetaPatch,
			)
			.pipe(
				filter(
					([stats, mmrPercentiles, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]) =>
						!!stats && !!currentBattlegroundsMetaPatch,
				),
				map(
					([stats, mmrPercentiles, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]) =>
						[
							stats.filter((stat) => stat.gameMode === 'battlegrounds').filter((stat) => stat.playerRank),
							timeFilter,
							getMmrThreshold(mmrFilter <= 100 ? mmrFilter : 100, mmrPercentiles),
							mmrGroupFilter,
							currentBattlegroundsMetaPatch,
						] as [GameStat[], BgsActiveTimeFilterType, number, MmrGroupFilterType, PatchInfo],
				),
				distinctUntilChanged((a, b) => this.compare(a, b)),
				map(([stats, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch]) =>
					this.buildValue(stats, timeFilter, mmrFilter, mmrGroupFilter, currentBattlegroundsMetaPatch),
				),
				tap((values: Value) => cdLog('emitting in ', this.constructor.name, values)),
				takeUntil(this.destroyed$),
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

	private compare(
		a: [GameStat[], BgsActiveTimeFilterType, number, MmrGroupFilterType, PatchInfo],
		b: [GameStat[], BgsActiveTimeFilterType, number, MmrGroupFilterType, PatchInfo],
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
