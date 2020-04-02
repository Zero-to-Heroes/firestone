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

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-warband-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-warband-stats.component.scss`,
	],
	template: `
		<div class="container">
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
export class BgsHeroWarbandStatsComponent implements AfterViewInit {
	@ViewChild('chart', { static: true }) chart: ElementRef;

	chartWidth: number;
	chartHeight: number;
	lineChartData: ChartDataSets[];
	lineChartLabels: Label[];
	lineChartOptions: ChartOptions = {
		responsive: true,
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
	};
	lineChartColors: Color[];

	@Input() set warbandStats(value: readonly { turn: number; totalStats: number }[]) {
		this.lineChartData = [{ data: value.map(stat => stat.totalStats), label: 'Warband stats delta' }];
		this.lineChartLabels = value.map(stat => '' + stat.turn);
		// this.lineChartColors = [
		// 	{
		// 		backgroundColor: this.getBackgroundColor(),
		// 		borderColor: '#CE73B4',
		// 		pointBackgroundColor: 'transparent',
		// 		pointBorderColor: 'transparent',
		// 		pointHoverBackgroundColor: '#fff',
		// 		pointHoverBorderColor: 'rgba(148,159,177,0.8)',
		// 	},
		// ];
	}

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.onResize();
	}

	@HostListener('window:resize')
	onResize() {
		const chartContainer = this.el.nativeElement.querySelector('.container');
		const rect = chartContainer.getBoundingClientRect();
		console.log('chartContainer', chartContainer, rect);
		this.chartWidth = rect.width;
		this.chartHeight = rect.width / 2;
		this.lineChartColors = [
			{
				backgroundColor: this.getBackgroundColor(),
				borderColor: '#CE73B4',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: 'rgba(148,159,177,0.8)',
			},
		];
		if (!(this.cdr as ViewRef).destroyed) {
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
