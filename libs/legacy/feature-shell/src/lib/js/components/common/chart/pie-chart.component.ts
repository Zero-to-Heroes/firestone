import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
// import { Color, Label } from 'ng2-charts';
import { sleep } from '../../../services/utils';
import { InputPieChartData, InputPieChartOptions } from './input-pie-chart-data';

@Component({
	selector: 'pie-chart',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/common/chart/pie-chart.component.scss`,
	],
	template: `
		<div class="container-1">
			<div
				style="display: flex; align-items: center; justify-content: flex-start; position: relative; height: 100%; width: 100%;"
			>
				<canvas
					*ngIf="chartData?.datasets?.length && chartOptions"
					#chart
					baseChart
					[data]="chartData"
					[options]="chartOptions"
					[plugins]="chartPlugins"
					[legend]="false"
					[type]="'pie'"
				></canvas>
				<div class="legend-container" *ngIf="legends?.length">
					<div class="legend-entry" *ngFor="let entry of legends">
						<div class="color" [style.backgroundColor]="entry.color"></div>
						<div class="name">{{ entry.label }}</div>
					</div>
				</div>
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

	@Input() set options(value: InputPieChartOptions) {
		this._options = value;
		this.updateValues();
	}

	chartData: ChartData<'pie'> = {
		datasets: [],
		labels: [],
	};
	chartOptions: ChartOptions;
	chartPlugins = [ChartDataLabels];
	legends: readonly ChartLegend[];

	private _options: InputPieChartOptions;
	private _inputData: readonly InputPieChartData[];

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	private async updateValues() {
		if (!this._inputData?.length) {
			return;
		}

		this.chartData = {
			labels: this._inputData.map((data) => data.label),
			datasets: [
				{
					data: this._inputData.map((d) => d.data),
					backgroundColor: this._inputData.map((data) => data.color),
					borderColor: 'transparent',
				},
			],
		};
		await this.updateChartOptions();

		if (this._options) {
			if (this._options.showLegendBelow) {
				this.legends = this._inputData
					.filter((data) => !!data.data)
					.map((data) => {
						return {
							label: data.label,
							color: data.color,
						};
					});
			} else {
				this.legends = [];
			}
		}
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
		const result: ChartOptions = {
			responsive: true,
			maintainAspectRatio: true,
			aspectRatio: this._options?.aspectRatio ?? 2,
			layout: {
				padding: {
					top: this._options?.padding?.top ?? 20,
					bottom: this._options?.padding?.bottom ?? 20,
					left: this._options?.padding?.left ?? 50,
					right: this._options?.padding?.right ?? 80,
				},
			},
			plugins: {
				datalabels: {
					// Don't show the "missing" labels
					display: (ctx) =>
						this._options?.showLegendBelow
							? false
							: this._options?.showAllLabels
							? true
							: ctx.dataIndex % 2 === 0,
					formatter: (value, ctx) => (value ? this._inputData[ctx.dataIndex].label : null),
					color: (ctx) => this._inputData[ctx.dataIndex].color as any,
					anchor: 'end',
					align: 'end',
					clip: false,
					font: {
						family: 'Open Sans',
						size: this._options?.tooltipFontSize ?? 13,
					},
				},
				tooltip: {
					backgroundColor: tooltipBackgroundColor,
					titleColor: fontColor,
					titleFont: {
						family: 'Open Sans',
					},
					titleAlign: 'right',
					bodyColor: fontColor,
					bodyFont: {
						family: 'Open Sans',
					},
					bodyAlign: 'right',
					padding: 5,
					caretPadding: 2,
					caretSize: 10,
					cornerRadius: 0,
					displayColors: true,
				},
			},
		};
		return result;
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

interface ChartLegend {
	readonly label: string;
	readonly color: string;
}
