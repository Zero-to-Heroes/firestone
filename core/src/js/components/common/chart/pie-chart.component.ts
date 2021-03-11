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
import { InputPieChartData } from './input-pie-chart-data';

declare let amplitude: any;

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
					*ngIf="chartData?.length"
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
	chartOptions: ChartOptions = this.buildChartOptions();
	chartColors: Color[];
	chartPlugins = [ChartDataLabels];

	private _inputData: readonly InputPieChartData[];

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	private updateValues() {
		if (!this._inputData?.length) {
			return;
		}

		this.chartData = this._inputData.map(data => data.data);
		this.chartLabels = this._inputData.map(data => data.label);
		this.chartColors = [
			{
				backgroundColor: this._inputData.map(data => data.color),
				borderColor: 'transparent',
			},
		];
		console.debug('set chart data', this.chartData, this.chartLabels, this.chartColors);
		this.updateChartOptions();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	previousWidth: number;

	private updateChartOptions() {
		this.chartOptions = this.buildChartOptions();
	}

	private buildChartOptions(): ChartOptions {
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
			plugins: {
				datalabels: {
					// Don't show the "missing" labels
					display: ctx => ctx.dataIndex % 2 === 0,
					formatter: (value, ctx) => (value ? this._inputData[ctx.dataIndex].label : null),
					color: ctx => this._inputData[ctx.dataIndex].color as any,
					anchor: 'end',
					align: 'end',
					clip: false,
				},
			},
		};
	}
}
