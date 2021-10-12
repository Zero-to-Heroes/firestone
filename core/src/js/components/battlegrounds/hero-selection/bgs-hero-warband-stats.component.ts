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
import { ChartData, ChartDataSets, ChartOptions, ChartTooltipItem } from 'chart.js';
import { Color, Label } from 'ng2-charts';

@Component({
	selector: 'bgs-hero-warband-stats',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-warband-stats.component.scss`,
	],
	template: `
		<div class="container">
			<div style="display: block;">
				<canvas
					#chart
					baseChart
					*ngIf="lineChartData?.length && lineChartData[0]?.data?.length"
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
			titleFontSize: 0,
			bodyFontFamily: 'Open Sans',
			bodyFontColor: '#40032E',
			xPadding: 5,
			yPadding: 5,
			caretSize: 10,
			caretPadding: 2,
			displayColors: false,
			cornerRadius: 0,
			callbacks: {
				beforeBody: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					return ['Turn ' + item[0].label, 'Stats ' + item[0].value];
				},
				label: (tooltipItem: ChartTooltipItem, data: ChartData): string | string[] => {
					return null;
				},
			},
		},
	};
	lineChartColors: Color[];

	@Input() set warbandStats(value: readonly { turn: number; totalStats: number }[]) {
		// Restrict the size of the data to avoid showing the outliers for the final turns
		const length = Math.min(value.length, 15);
		this.lineChartData = [
			{ data: value.map((stat) => stat.totalStats).slice(0, length), label: 'Warband stats delta' },
		];
		this.lineChartLabels = value.map((stat) => '' + stat.turn).slice(0, length);
	}

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.onResize();
	}

	@HostListener('window:resize')
	onResize() {
		const chartContainer = this.el.nativeElement.querySelector('.container');
		const rect = chartContainer.getBoundingClientRect();

		this.chartWidth = rect.width;
		this.chartHeight = rect.width / 2;
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private getBackgroundColor() {
		if (!this.chart?.nativeElement) {
			return;
		}
		const gradient = this.chart.nativeElement
			?.getContext('2d')
			?.createLinearGradient(0, 0, 0, Math.round(this.chartHeight));
		gradient.addColorStop(0, 'rgba(206, 115, 180, 1)'); // #CE73B4
		gradient.addColorStop(0.4, 'rgba(206, 115, 180, 0.4)');
		gradient.addColorStop(1, 'rgba(206, 115, 180, 0)');

		return gradient;
	}
}
