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
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-personal-stats-rating',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-rating.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-rating">
			<div class="container-1">
				<div style="display: block; position: relative; height: 100%; width: 100%;">
					<canvas
						#chart
						baseChart
						*ngIf="lineChartData"
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
		scales: {
			xAxes: [
				{
					gridLines: {
						color: '#40032E',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
					},
				},
			],
			yAxes: [
				{
					id: 'delta-stats',
					position: 'left',
					gridLines: {
						color: '#841063',
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
	}

	@HostListener('window:resize')
	onResize() {
		this.doResize();
	}

	private doResize() {
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
		const rect = chartContainer?.getBoundingClientRect();
		if (!rect?.width || !rect?.height || !this.chart?.nativeElement?.getContext('2d')) {
			setTimeout(() => {
				this.doResize();
			}, 500);
			return;
		}
		if (rect.width === this.chartWidth && rect.height === this.chartHeight) {
			return;
		}
		this.chartWidth = rect.width;
		this.chartHeight = rect.height;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => this.doResize(), 200);
	}

	private updateValues() {
		if (!this._state || !this._category) {
			return;
		}
		this.lineChartData = [
			{
				data: this._state.matchStats
					.filter(match => match.playerRank)
					.reverse()
					.map(match => parseInt(match.playerRank)),
				label: 'Rating',
			},
		];
		this.lineChartLabels = Array.from(Array(this.lineChartData[0].data.length), (_, i) => i + 1).map(
			matchIndex => '' + matchIndex,
		);
		this.lineChartColors = [
			{
				backgroundColor: 'transparent',
				borderColor: '#ffb948',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
		];
		// console.log('chartData', this.lineChartData, this.lineChartLabels);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
