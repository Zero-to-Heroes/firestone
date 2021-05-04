import {
	ApplicationRef,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { ChartData, ChartDataSets, ChartOptions, ChartTooltipItem, ChartTooltipModel } from 'chart.js';
import { Color, Label } from 'ng2-charts';
import { SimpleBarChartData } from './simple-bar-chart-data';

declare let amplitude: any;

@Component({
	selector: 'simple-bar-chart',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/common/chart/simple-bar-chart.component.scss`,
	],
	template: `
		<div class="chart-container" [style.opacity]="opacity">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="chartData?.length && chartData[0]?.data?.length"
					#chart
					baseChart
					[style.width.px]="chartWidth"
					[style.height.px]="chartHeight"
					[datasets]="chartData"
					[labels]="chartLabels"
					[options]="chartOptions"
					[colors]="chartColors"
					[legend]="false"
					[chartType]="'bar'"
				></canvas>
			</div>
		</div>
	`,
	// changeDetection: ChangeDetectionStrategy.OnPush,
	changeDetection: ChangeDetectionStrategy.Default,
})
export class SimpleBarChartComponent {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	chartWidth: number;
	chartHeight: number;
	chartData: ChartDataSets[];
	chartLabels: Label[];
	chartOptions: ChartOptions = {
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
					display: false,
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
					display: false,
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
			enabled: false,
			callbacks: {
				beforeBody: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					// console.log('beforeBody', item, data);
					return data.datasets?.map((dataset) => dataset?.label || '') || [];
				},
			},
			custom: (tooltip: ChartTooltipModel) => {
				let tooltipEl = document.getElementById('chartjs-tooltip-stats-' + this.id);
				const chartParent = this.chart.nativeElement.parentNode;

				if (!tooltipEl) {
					tooltipEl = document.createElement('div');
					tooltipEl.id = 'chartjs-tooltip-stats-' + this.id;
					tooltipEl.classList.add('tooltip-container');
					tooltipEl.innerHTML = `
						<div class="stats-tooltip">					
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0"/>
							</svg>
							<div class="content"></div>
						</div>`;
					chartParent.appendChild(tooltipEl);
				}

				// Hide if no tooltip
				if (tooltip.opacity === 0) {
					tooltipEl.style.opacity = '0';
					return;
				}

				// Set Text
				if (tooltip.body) {
					// console.log('tooltip data', tooltip, this);
					const dataPoint = tooltip.dataPoints[0];
					const innerHtml = `
						<div class="body">
							<div class="title">${this.tooltipTitle}</div>
							<div class="label">${dataPoint.label} wins</div>
							<div class="value">${(+dataPoint.value).toFixed(1)}% of runs</div>
						</div>
					`;

					const tableRoot = tooltipEl.querySelector('.content');
					tableRoot.innerHTML = innerHtml;
				}

				// const left = Math.max(
				// 	-10,
				// 	Math.min(tooltip.caretX - 110, chartParent.getBoundingClientRect().right - rect.width),
				// );
				const tooltipArrowEl: any = tooltipEl.querySelector('.tooltip-arrow');
				const left = -10; // Would be 0 but for the 10px padding
				const carretLeft = tooltip.caretX;
				tooltipArrowEl.style.left = carretLeft + 'px';

				// Display, position, and set styles for font
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = left + 'px';
				tooltipEl.style.top = tooltip.caretY + 8 - 100 + 'px';
				tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
				tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
				tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
				tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';

				// Set caret Position
				tooltipEl.classList.remove('above', 'below', 'no-transform');
				tooltipEl.classList.add('top');
			},
		},
	};
	chartColors: Color[];
	opacity = 0;

	@Input() set data(value: SimpleBarChartData) {
		if (value === this._data) {
			return;
		}
		this._data = value;
		this.setStats(value);
	}

	@Input() id: string;
	@Input() tooltipTitle = 'Title';

	private _data: SimpleBarChartData;

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly appRef: ApplicationRef,
	) {}

	onActivate(event) {
		setTimeout(() => {
			this.appRef.tick();
		}, 200);
	}

	onDeactivate(event) {
		setTimeout(() => {
			this.appRef.tick();
		}, 200);
	}

	@HostListener('window:resize')
	onResize() {
		// console.log('window resize');
		// this._dirty = true;
		this.doResize();
	}

	axisTickFormatter(text: string): string {
		return parseInt(text).toFixed(0);
	}

	private async setStats(value: SimpleBarChartData) {
		// Timeout is needed so that the CSS variable has been computed
		setTimeout(() => {
			this.chartLabels = value.data.map((data) => data.label);
			this.chartData = [
				{
					data: value.data.map((data) => data.value),
					label: 'Win distribution',
				},
			];
			// console.log('chartData', this.chartData);
			this.doResize();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 10);
	}

	private doResize() {
		const chartContainer = this.el.nativeElement.querySelector('.chart-container');
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
		const color = this.getColor();
		this.chartColors = [
			{
				backgroundColor: color,
				borderColor: color,
				hoverBackgroundColor: this.getHoverColor(),
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
		];
		this.opacity = color && this.chartData && this.chartData.length > 0 ? 1 : 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		// setTimeout(() => {
		// 	this.doResize();
		// }, 200);
	}

	private getColor() {
		return getComputedStyle(this.el.nativeElement).getPropertyValue('--bar-chart-bar-color');
	}

	private getHoverColor() {
		return getComputedStyle(this.el.nativeElement).getPropertyValue('--on-bar-chart-bar-color');
	}
}
