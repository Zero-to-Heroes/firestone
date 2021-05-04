import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { BattlegroundsAppState } from '../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsPersonalRatingCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-rating-category';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { formatDate, groupByFunction } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-personal-stats-rating',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-rating">
			<div class="header">MMR / Matches</div>
			<div class="container-1" *ngIf="lineChartData">
				<div style="display: block; position: relative; height: 100%; width: 100%;">
					<canvas
						#chart
						*ngIf="lineChartData?.length && lineChartData[0]?.data?.length"
						baseChart
						[style.opacity]="opacity"
						[style.width.px]="chartWidth"
						[style.height.px]="chartHeight"
						[datasets]="lineChartData"
						[labels]="lineChartLabels"
						[options]="lineChartOptions"
						[colors]="lineChartColors"
						[legend]="false"
						[chartType]="'line'"
					></canvas>
				</div>
			</div>
			<battlegrounds-empty-state
				*ngIf="!lineChartData"
				subtitle="Start playing Battlegrounds to collect some information"
			></battlegrounds-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsRatingComponent implements AfterViewInit {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	_category: BattlegroundsPersonalRatingCategory;
	_state: BattlegroundsAppState;

	chartWidth: number;
	chartHeight: number;
	lineChartData: ChartDataSets[];
	lineChartLabels: Label[];
	lineChartOptions: ChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		layout: {
			padding: 0,
		},
		plugins: {
			datalabels: {
				display: false,
			},
		},
		scales: {
			xAxes: [
				{
					gridLines: {
						color: '#841063',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
						maxTicksLimit: 15,
					},
				},
			],
			yAxes: [
				{
					id: 'delta-stats',
					position: 'left',
					gridLines: {
						color: '#40032E',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
						beginAtZero: true,
					},
				},
			],
		},
		tooltips: {
			mode: 'index',
			position: 'nearest',
			intersect: false,
			backgroundColor: '#CE73B4',
			// titleFontSize: 0,
			titleFontFamily: 'Open Sans',
			titleFontColor: '#40032E',
			bodyFontFamily: 'Open Sans',
			bodyFontColor: '#40032E',
			xPadding: 5,
			yPadding: 5,
			caretSize: 10,
			caretPadding: 2,
			cornerRadius: 0,
			displayColors: false,
			enabled: true,
		},
	};
	lineChartColors: Color[];
	opacity = 0;

	@Input() set category(value: BattlegroundsPersonalRatingCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.updateValues();
	}

	@Input() set state(value: BattlegroundsAppState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.onResize();
	}

	@HostListener('window:resize')
	onResize() {
		setTimeout(() => this.doResize(2));
	}

	private doResize(resizeLeft = 1) {
		if (resizeLeft <= 0) {
			// console.log('resize over', resizeLeft);
			return;
		}
		// console.log('resizing', resizeLeft);
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
		const rect = chartContainer?.getBoundingClientRect();
		if (!rect?.width || !rect?.height || !this.chart?.nativeElement?.getContext('2d')) {
			setTimeout(() => {
				// console.log('no rect info, returning', rect);
				this.doResize(resizeLeft);
			}, 500);
			return;
		}
		if (rect.width === this.chartWidth && rect.height === this.chartHeight) {
			// console.log('already setup up, returning');
			setTimeout(() => this.doResize(resizeLeft - 1), 5000);
			return;
		}
		// console.log('udpating chart dimensions', rect.width, rect.height, this.chartWidth, this.chartHeight);
		this.chartWidth = rect.width;
		this.chartHeight = rect.height;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => this.doResize(resizeLeft - 1), 200);
	}

	private updateValues() {
		if (!this._state?.matchStats || !this._category) {
			return;
		}
		const data = this._state.matchStats.filter((match) => match.playerRank).reverse();
		if (data.length === 0) {
			this.lineChartData = null;
			this.lineChartLabels = null;
			return;
		}

		const fakeMatchWithCurrentMmr: GameStat = data[data.length - 1].newPlayerRank
			? GameStat.create({
					...data[data.length - 1],
					playerRank: data[data.length - 1].newPlayerRank,
			  } as GameStat)
			: null;
		const dataWithCurrentMmr = fakeMatchWithCurrentMmr ? [...data, fakeMatchWithCurrentMmr] : data;
		// Remove the first match if we're on a "last patch" filter
		const finalData =
			this._state.activeTimeFilter === 'last-patch'
				? [
						GameStat.create({
							...dataWithCurrentMmr[0],
							playerRank: '0',
						} as GameStat),
						...dataWithCurrentMmr.slice(1),
				  ]
				: dataWithCurrentMmr;
		if (this._state.activeGroupMmrFilter === 'per-day') {
			const groupedByDay = groupByFunction((match: GameStat) => formatDate(new Date(match.creationTimestamp)))(
				finalData,
			);
			//console.log('groupedByDay', groupedByDay);
			const values = Object.values(groupedByDay).map((games: readonly GameStat[]) =>
				parseInt(games[games.length - 1].playerRank),
			);
			//console.log('values', values);
			//console.log('days', Object.keys(groupedByDay));
			this.lineChartData = [
				{
					data: values,
					label: 'Rating',
				},
			];
			this.lineChartLabels = Object.keys(groupedByDay);
		} else {
			this.lineChartData = [
				{
					data: finalData.map((match) => parseInt(match.playerRank)),
					label: 'Rating',
				},
			];
			this.lineChartLabels = Array.from(Array(this.lineChartData[0].data.length), (_, i) => i + 1).map(
				(matchIndex) => '' + matchIndex,
			);
		}

		if (!this.chartHeight) {
			// console.log('rating chart height not present yet, refreshing', this.chartHeight);
			setTimeout(() => {
				this.updateValues();
			}, 10);
			return;
		}
		this.lineChartColors = [
			{
				backgroundColor: this.getBackgroundColor(),
				borderColor: '#CE73B4',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
		];
		this.opacity = 1;
		// console.log('chartData', this.lineChartData, this.lineChartLabels, this.lineChartColors);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private getBackgroundColor() {
		// console.log('setting gradient', Math.round(this.chartHeight));
		if (!this.chart?.nativeElement) {
			// console.log('no native element, not returning gradient', this.chart);
			return;
		}

		// console.log('creating gradient', this.chartHeight);
		const gradient = this.chart.nativeElement
			?.getContext('2d')
			?.createLinearGradient(0, 0, 0, Math.round(this.chartHeight));
		if (!gradient) {
			// console.log('no gradient, returning', this.chartHeight);
			return;
		}

		gradient.addColorStop(0, 'rgba(206, 115, 180, 0.8)'); // #CE73B4
		gradient.addColorStop(0.4, 'rgba(206, 115, 180, 0.4)');
		gradient.addColorStop(1, 'rgba(206, 115, 180, 0)');
		// console.log('returning gradient', gradient);
		return gradient;
	}
}
