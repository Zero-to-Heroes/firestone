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
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { OverwolfService } from '../../../services/overwolf.service';

// https://github.com/valor-software/ng2-charts/issues/424
@Component({
	selector: 'decktracker-personal-stats-ranking',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-personal-stats-ranking.component.scss`,
	],
	template: `
		<div class="decktracker-personal-stats-ranking">
			<div class="header">Rank evolution / Matches</div>
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
			<!-- <battlegrounds-empty-state
				*ngIf="!lineChartData"
				subtitle="Start playing Battlegrounds to collect some information"
			></battlegrounds-empty-state> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerPersonalStatsRankingComponent implements AfterViewInit {
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

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	private _state: MainWindowState;

	constructor(
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		// BaseChartDirective.registerPlugin({
		// 	beforeRender: function(x, options) {
		// 		console.log('beforeRender', x, options);
		// 		// var c = x.chart;
		// 		// var dataset = x.data.datasets[0];
		// 		// var yScale = x.scales['y-axis-0'];
		// 		// var yPos = yScale.getPixelForValue(0);

		// 		// var gradientFill = c.ctx.createLinearGradient(0, 0, 0, c.height);
		// 		// gradientFill.addColorStop(0, 'green');
		// 		// gradientFill.addColorStop(yPos / c.height - 0.01, 'green');
		// 		// gradientFill.addColorStop(yPos / c.height + 0.01, 'red');
		// 		// gradientFill.addColorStop(1, 'red');

		// 		// var model = x.data.datasets[0]._meta[Object.keys(dataset._meta)[0]].dataset._model;
		// 		// model.backgroundColor = gradientFill;
		// 	},
		// 	beforeDatasetDraw: (chart, easing: any, options) => {
		// 		var dataset = chart.config.data.datasets[0];
		// 		console.log('before dataset draw', chart, easing, options, dataset, this);
		// 		var yScale = (chart as any).scales['y-axis-0'];
		// 		var gradientFill = chart.ctx.createLinearGradient(0, 0, 0, chart.height);
		// 		if (!this.colors || this.colors.length === 0) {
		// 			return;
		// 		}
		// 		gradientFill.addColorStop(1, this.colors[0].code);
		// 		console.log('adding color stop', 1, this.colors[0].code);
		// 		this.thresholds.forEach((threshold: number, index: number) => {
		// 			const yPos = yScale.getPixelForValue(threshold);
		// 			gradientFill.addColorStop(yPos / chart.height, this.colors[index].code);
		// 			const nextYPost =
		// 				index === this.thresholds.length - 1 ? 0 : yScale.getPixelForValue(this.thresholds[index + 1]);
		// 			console.log('building gradient for', threshold, index, yPos, nextYPost);
		// 			console.log('adding color stop', yPos / chart.height, this.colors[index].code);
		// 			gradientFill.addColorStop(
		// 				yPos / chart.height,
		// 				nextYPost === 0 ? 'transparent' : this.colors[index + 1].code,
		// 			);
		// 			console.log(
		// 				'adding color stop',
		// 				yPos / chart.height,
		// 				nextYPost === 0 ? 'transparent' : this.colors[index + 1].code,
		// 			);
		// 			// gradientFill.addColorStop(
		// 			// 	nextYPost / chart.height,
		// 			// 	nextYPost === 0 ? 'transparent' : this.colors[index + 1].code,
		// 			// );
		// 		});
		// 		gradientFill.addColorStop(0, 'transparent');
		// 		console.log('built gradient', gradientFill);

		// 		var model = chart.getDatasetMeta(0).dataset['_model'];
		// 		// model.borderColor =
		// 		console.log('model', model, chart.getDatasetMeta(0));
		// 		model.backgroundColor = gradientFill;
		// 	},
		// });

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

	thresholds = [];
	colors = [];
	private updateValues() {
		if (!this._state?.decktracker?.decks) {
			return;
		}

		const replays = (this._state.decktracker.decks
			.map((deck) => deck.replays)
			.reduce((a, b) => a.concat(b), []) as GameStat[])
			.filter((replay) => replay.playerRank)
			// .filter(replay => !replay.playerRank.includes('legend'))
			.sort((a: GameStat, b: GameStat) => {
				if (a.creationTimestamp <= b.creationTimestamp) {
					return -1;
				}
				return 1;
			});
		if (replays.length === 0) {
			this.lineChartData = null;
			this.lineChartLabels = null;
			return;
		}
		// map each replay on a scale from -50 (Bronze 10) to 1 (Diamond 1) and 0 being Legend
		// Legend rank evolution will be shown on a separate graph
		const allLegendRanks = replays
			.filter((replay) => replay.gameFormat === 'standard')
			.filter((replay) => replay.playerRank.includes('legend'))
			.map((replay) => parseInt(replay.playerRank.split('legend-')[1]));
		// The lowest Legend Rank will be 0, and the best will be +lowestLegendRank
		const lowestLegendRank = Math.max(...allLegendRanks);
		const standard = replays
			.filter((replay) => replay.gameFormat === 'standard')
			.map((replay) => {
				const result = this.convertPlayerRank(replay.playerRank, lowestLegendRank);
				// console.log('converted', replay.playerRank, 'to', result, lowestLegendRank);
				return result;
			});
		const inflationFactor = lowestLegendRank / 100;
		this.thresholds = [
			0,
			10 * inflationFactor,
			20 * inflationFactor,
			30 * inflationFactor,
			40 * inflationFactor,
			50 * inflationFactor,
			50 * inflationFactor + lowestLegendRank - 500, // TODO: what if lowest legend is better than 500?
			50 * inflationFactor + lowestLegendRank - 100,
			50 * inflationFactor + lowestLegendRank - 10,
		];

		this.lineChartData = [
			{
				data: standard,
				label: 'Standard ranking (pre-legend)',
			},
			// {
			// 	data: wild,
			// 	label: 'Wild ranking (pre-legend)',
			// },
		];
		// console.log('lineChartData', this.lineChartData);
		this.lineChartLabels = Array.from(Array(this.lineChartData[0].data.length), (_, i) => i + 1).map(
			(matchIndex) => '' + matchIndex,
		);

		if (!this.chartHeight) {
			console.log('rating chart height not present yet, refreshing', this.chartHeight);
			setTimeout(() => {
				this.updateValues();
			}, 10);
			return;
		}
		this.colors = [
			// Bronze
			{
				code: '#934b35',
			},
			// Silver
			{
				code: '#696c6b',
			},
			// Gold
			{
				code: '#955d00',
			},
			// Platinum
			{
				code: '#aca98e',
			},
			// Diamond
			{
				code: '#5e93b5',
			},
			// Legend
			{
				code: '#c8ac7e',
			},
			// Top500
			{
				code: '#dab06c',
			},
			// Top100
			{
				code: '#edb45a',
			},
			// Top10
			{
				code: '#ffb948',
			},
		];
		this.lineChartColors = [
			{
				// backgroundColor: this.getBackgroundColor(),
				backgroundColor: 'transparent',
				borderColor: '#934b35',
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

	private convertPlayerRank(inputRank: string, lowestLegendRank: number): number {
		// Now we want the non-legend part to take about 1/3 of the graph, to keep the focus on the legend
		// Since pre-legend ranks are in a 50 interval range, if we were to show that data unchanged it
		// would be squeezed a lot by the legend info
		// So we inflate it
		const nonLegendSize = 0.5;
		const inflationFactor = (nonLegendSize * lowestLegendRank) / (50 * (1 - nonLegendSize));
		if (inputRank.includes('legend')) {
			return 50 * inflationFactor + lowestLegendRank - parseInt(inputRank.split('legend-')[1]);
		}
		const [leagueId, rankInLeague] = inputRank.split('-').map((info) => parseInt(info));
		return inflationFactor * (50 + -10 * (leagueId - 1) - rankInLeague);
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
