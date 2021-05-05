import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { SimpleBarChartData } from './simple-bar-chart-data';

@Component({
	selector: 'basic-bar-chart',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/common/chart/basic-bar-chart.component.scss`,
	],
	template: `
		<div class="chart-container" *ngIf="bars?.length">
			<div class="bar" *ngFor="let bar of bars" [style.height.%]="bar.height" [helpTooltip]="bar.tooltip"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicBarChartComponent {
	@Input() set data(value: SimpleBarChartData) {
		if (value === this._data) {
			return;
		}
		this._data = value;
		this.udpateStats();
	}

	@Input() set tooltipTitle(value: string) {
		this._tooltipTitle = value;
		this.udpateStats();
	}

	bars: readonly Bar[] = [];

	private _data: SimpleBarChartData;
	private _tooltipTitle = 'Title';

	constructor(private readonly cdr: ChangeDetectorRef) {}

	udpateStats() {
		if (!this._data) {
			return;
		}

		const max: number = Math.max(...this._data.data.map((data) => data.value));
		this.bars = this._data.data.map((data) => ({
			height: (100 * data.value) / max,
			tooltip: `
				<div class="body">
					<div class="title">${this._tooltipTitle}</div>
					<div class="label">${data.label} wins</div>
					<div class="value">${(+data.value).toFixed(1)}% of runs</div>
				</div>`,
		}));
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}
}

interface Bar {
	readonly height: number;
	readonly tooltip: string;
}
