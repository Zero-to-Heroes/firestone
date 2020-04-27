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
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-warband-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-warband-stats.component.scss`,
	],
	template: `
		<div class="container" [ngStyle]="{ 'loading': isLoading }">
			<div style="display: block;">
				<canvas
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
	@ViewChild('chart', { static: true }) chart: ElementRef;

	isLoading: boolean = true;
	chartWidth: number;
	chartHeight: number;
	lineChartData: ChartDataSets[];
	lineChartLabels: Label[];
	lineChartOptions: ChartOptions = {
		responsive: true,
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

	@Input() set stats(value: BgsPostMatchStatsPanel) {
		console.log('[warband-stats] setting value', value);
		const averageStats: readonly { turn: number; totalStats: number }[] = value.globalStats.heroStats.find(
			stat => stat.id === 'average',
		).warbandStats;
		const warbandStats: readonly { turn: number; totalStats: number }[] = value.globalStats.heroStats.find(
			stat => stat.id === value.player.cardId,
		).warbandStats;
		const lastTurn = Math.min(warbandStats.length, value.stats.totalStatsOverTurn.length);
		this.lineChartLabels = [...Array(lastTurn).keys()].map(turn => '' + turn);
		this.lineChartData = [
			{
				data: warbandStats.map(
					stat => stat.totalStats + averageStats.find(avg => avg.turn === stat.turn).totalStats,
				),
				label: 'Average stats for hero',
			},
			{
				data: value.stats.totalStatsOverTurn.map(stat => stat.value),
				label: 'This run',
			},
		];
		this.isLoading = false;
		console.log('[warband-stats] info computed');
	}

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.onResize();
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

	@HostListener('window:resize')
	onResize() {
		const chartContainer = this.el.nativeElement.querySelector('.container');
		const rect = chartContainer.getBoundingClientRect();
		console.log('chartContainer', chartContainer, rect);
		this.chartWidth = rect.width;
		this.chartHeight = rect.width / 2;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private getBackgroundColor() {
		console.log('setting gradient', Math.round(this.chartHeight));
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
