/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { SimpleBarChartData, SimpleBarChartDataElement } from './simple-bar-chart-data';

@Component({
	selector: 'basic-bar-chart-2',
	styleUrls: [`./basic-bar-chart-2.component.scss`],
	template: `
		<div class="chart-container" *ngIf="barContainers?.length">
			<div class="mid-line" [style.bottom.%]="midLineHeight"></div>
			<div class="bar-container" *ngFor="let container of barContainers">
				<div class="bars">
					<div
						*ngFor="let bar of container.bars"
						class="bar {{ bar.class }}"
						[style.height.%]="bar.height"
						[helpTooltip]="bar.tooltip"
					></div>
				</div>
				<div class="label" *ngIf="showLabels">{{ container.label }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicBarChart2Component {
	@Input() set data(value: readonly SimpleBarChartData[]) {
		if (!value || value === this.chartData) {
			return;
		}
		this.chartData = value;
		this.udpateStats();
	}

	@Input() set tooltipTitle(value: string) {
		this._tooltipTitle = value;
		this.udpateStats();
	}

	@Input() set midLineValue(value: number) {
		this._midLineValue = value;
		this.udpateStats();
	}

	@Input() set offsetValue(value: number) {
		this._offsetValue = value;
		this.udpateStats();
	}

	@Input() showLabels = true;

	barContainers: readonly BarContainer[] = [];
	midLineHeight: number;

	private chartData: readonly SimpleBarChartData[];
	private _tooltipTitle;
	private _midLineValue: number;
	private _offsetValue = 0;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {}

	udpateStats() {
		if (!this.chartData) {
			return;
		}

		const maxValues: readonly number[] = this.chartData
			.map((chartData) => chartData.data)
			.map((data) =>
				Math.max(
					...data
						.reduce((a, b) => a.concat(b), [])
						.map((element: SimpleBarChartDataElement) => element.value),
				),
			);
		const maxDataLength = Math.max(...this.chartData.map((chartData) => chartData.data.length));
		const barContainers: BarContainer[] = [];
		for (let i = 0; i < maxDataLength; i++) {
			const barContainer: BarContainer = this.buildBarContainer(
				this.chartData.map((data) => data.data[i]),
				maxValues,
				i,
			);
			barContainers.push(barContainer);
		}
		this.barContainers = barContainers;
		this.midLineHeight = (100 * this._midLineValue) / maxValues[0];
	}

	private buildBarContainer(
		elements: SimpleBarChartDataElement[],
		maxValues: readonly number[],
		xValue: number,
	): BarContainer {
		return {
			bars: elements
				.filter((data) => !!data)
				.map((data, i) => {
					const tooltipTitle = this._tooltipTitle ? `<div class="title">${this._tooltipTitle}</div>` : '';
					const placeLabel = this.i18n.translateString('battlegrounds.hero-stats.place', {
						value: data.label,
					});
					const matchesLabel =
						data.rawValue != null
							? this.i18n.translateString('battlegrounds.hero-selection.total-matches', {
									value: data.rawValue,
							  })
							: null;
					const matchesElement = !!matchesLabel ? `<div class="raw-value">${matchesLabel}</div>` : '';
					return {
						// Ensure a min height to make the graph look better
						height: Math.max((100 * data.value) / maxValues[i], 2),
						class: `data-${i} data-x-${xValue}`,
						tooltip: `
							<div class="body">
								${tooltipTitle}
								<div class="label">${placeLabel}</div>
								${matchesElement}
								<div class="value">${(+data.value).toFixed(1)}%</div>
							</div>`,
					};
				}),
			label: '' + (xValue + this._offsetValue),
		} as BarContainer;
	}
}

interface BarContainer {
	readonly bars: Bar[];
	readonly label: string;
}

interface Bar {
	readonly height: number;
	readonly class: string;
	readonly tooltip: string;
}
