import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { Label } from 'aws-sdk/clients/cloudhsm';
import { ChartData, ChartDataSets, ChartOptions, ChartTooltipItem } from 'chart.js';
import { Color } from 'ng2-charts';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { BgsStats } from '../../../models/battlegrounds/stats/bgs-stats';

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-warband-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-warband-stats.component.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-stats.component.scss`,
	],
	template: `
		<div class="container-1">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="lineChartData"
					#chart
					baseChart
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
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartWarbandStatsComponent implements AfterViewInit {
	@ViewChild('chart', { static: false }) chart: ElementRef;

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
						color: '#841063',
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
						color: '#40032E',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
					},
				},
			],
		},
		tooltips: {
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
			displayColors: false,
			callbacks: {
				title: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					// console.log('title for', data.datasets[item[0].datasetIndex].label, item, data);
					return data.datasets[item[0].datasetIndex].label;
				},
				beforeBody: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					return ['Turn: ' + item[0].label, 'Stats: ' + item[0].value];
				},
				label: (item: ChartTooltipItem, data: ChartData): string | string[] => {
					// console.log('label for', item, data);
					return null;
				},
			},
		},
	};
	lineChartColors: Color[];

	private _globalStats: BgsStats;
	private _stats: BgsPostMatchStats;
	private _player: BgsPlayer;

	@Input() set globalStats(value: BgsStats) {
		if (value === this._globalStats) {
			return;
		}
		// console.log('setting value', value, this._globalStats);
		this._globalStats = value;
		this.updateInfo();
	}

	@Input() set stats(value: BgsPostMatchStats) {
		if (value === this._stats) {
			return;
		}
		// console.log('setting value', value, this._stats);
		this._stats = value;
		this.updateInfo();
	}

	@Input() set player(value: BgsPlayer) {
		if (value === this._player) {
			return;
		}
		// console.log('setting value', value, this._player);
		this._player = value;
		this.updateInfo();
	}

	private updateInfo() {
		if (!this._player || !this._stats || !this._globalStats) {
			return;
		}
		const averageStats: readonly { turn: number; totalStats: number }[] = this._globalStats.heroStats.find(
			stat => stat.id === 'average',
		).warbandStats;
		const warbandStats: readonly { turn: number; totalStats: number }[] = this._globalStats.heroStats.find(
			stat => stat.id === this._player.cardId,
		).warbandStats;
		const lastTurn = Math.min(warbandStats.length, this._stats.totalStatsOverTurn.length);
		this.lineChartLabels = [...Array(lastTurn).keys()].map(turn => '' + turn);
		this.lineChartData = [
			{
				data: warbandStats.map(
					stat => stat.totalStats + averageStats.find(avg => avg.turn === stat.turn).totalStats,
				),
				label: 'Average stats for hero',
			},
			{
				data: this._stats.totalStatsOverTurn.map(stat => stat.value),
				label: 'This run',
			},
		];
		// console.log('[warband-stats] info computed');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {
		this.cdr.detach();
	}

	ngAfterViewInit() {
		// console.log('after view init in warband stats');
		this.onResize();
		if (!this.chartHeight || !this.chart?.nativeElement?.getContext('2d')) {
			// console.log('chart not present', this.chartHeight, this.chart);
			setTimeout(() => this.ngAfterViewInit(), 200);
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
			{
				backgroundColor: 'transparent',
				borderColor: '#FFB948',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
		];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	previousWidth: number;

	@HostListener('window:resize')
	onResize() {
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
		const rect = chartContainer?.getBoundingClientRect();
		if (!rect?.width || !rect?.height) {
			setTimeout(() => {
				this.onResize();
			}, 500);
			return;
		}
		if (rect.width === this.previousWidth) {
			// console.log('correct container size', this.previousWidth, this.chartWidth, this.chartHeight);
			return;
		}
		this.previousWidth = rect.width;
		// console.log('chartContainer', chartContainer, rect);
		this.chartWidth = rect.width;
		this.chartHeight = rect.width / 2;
		if (this.chartHeight > rect.height) {
			this.chartHeight = rect.height;
			this.chartWidth = 2 * this.chartHeight;
		}
		// console.log('setting chart dimensions', this.chartHeight, this.chartWidth);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		// setTimeout(() => this.onResize(), 200);
	}

	private getBackgroundColor() {
		// console.log('setting gradient', Math.round(this.chartHeight));
		const gradient = this.chart.nativeElement
			.getContext('2d')
			.createLinearGradient(0, 0, 0, Math.round(this.chartHeight));
		gradient.addColorStop(0, 'rgba(206, 115, 180, 1)'); // #CE73B4
		gradient.addColorStop(0.4, 'rgba(206, 115, 180, 0.4)');
		gradient.addColorStop(1, 'rgba(206, 115, 180, 0)');
		console.log('returning gradient', gradient);
		return gradient;
	}
}
