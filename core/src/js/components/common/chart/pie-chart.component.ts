import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Color, Label } from 'ng2-charts';
import { sleep } from '../../../services/utils';
import { InputPieChartData } from './input-pie-chart-data';

@Component({
	selector: 'pie-chart',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/common/chart/pie-chart.component.scss`,
	],
	template: `
		<div class="container-1">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="chartData?.length && chartOptions"
					#chart
					baseChart
					[data]="chartData"
					[labels]="chartLabels"
					[options]="chartOptions"
					[colors]="chartColors"
					[plugins]="chartPlugins"
					[legend]="false"
					[chartType]="'pie'"
				></canvas>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	@Input() set data(value: readonly InputPieChartData[]) {
		this._inputData = value;
		this.updateValues();
	}

	chartData: readonly number[] = [];
	chartLabels: readonly Label[];
	chartOptions: ChartOptions;
	chartColors: Color[];
	chartPlugins = [ChartDataLabels];

	private _inputData: readonly InputPieChartData[];

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	private async updateValues() {
		if (!this._inputData?.length) {
			return;
		}

		this.chartData = this._inputData.map((data) => data.data);
		this.chartLabels = this._inputData.map((data) => data.label);
		this.chartColors = [
			{
				backgroundColor: this._inputData.map((data) => data.color),
				borderColor: 'transparent',
			},
		];
		await this.updateChartOptions();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	previousWidth: number;

	private async updateChartOptions() {
		this.chartOptions = await this.buildChartOptions();
	}

	private async buildChartOptions(): Promise<ChartOptions> {
		const tooltipBackgroundColor = await this.getCssPropetyValue('--color-5');
		const fontColor = await this.getCssPropetyValue('--default-text-color');
		return {
			responsive: true,
			// maintainAspectRatio: true,
			// aspectRatio: 1,
			layout: {
				padding: {
					top: 20,
					bottom: 20,
					left: 50,
					right: 80,
				},
			},
			tooltips: {
				backgroundColor: tooltipBackgroundColor,
				bodyFontFamily: 'Open Sans',
				titleFontFamily: 'Open Sans',
				bodyFontColor: fontColor,
				titleFontColor: fontColor,
				bodyAlign: 'right',
				titleAlign: 'right',
				displayColors: true,
				xPadding: 5,
				yPadding: 5,
			},
			plugins: {
				datalabels: {
					// Don't show the "missing" labels
					display: (ctx) => ctx.dataIndex % 2 === 0,
					formatter: (value, ctx) => (value ? this._inputData[ctx.dataIndex].label : null),
					color: (ctx) => this._inputData[ctx.dataIndex].color as any,
					anchor: 'end',
					align: 'end',
					clip: false,
				},
			},
		};
	}

	private async getCssPropetyValue(prop: string): Promise<string> {
		let tooltipBackgroundColor = getComputedStyle(this.el.nativeElement).getPropertyValue(prop);
		let tries = 0;
		while (!tooltipBackgroundColor?.length && tries < 100) {
			await sleep(50);
			tooltipBackgroundColor = getComputedStyle(this.el.nativeElement).getPropertyValue(prop);
			tries++;
		}
		return tooltipBackgroundColor;
	}
}
