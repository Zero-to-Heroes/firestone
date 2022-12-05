import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { SimpleBarChartData } from './simple-bar-chart-data';

@Component({
	selector: 'basic-bar-chart',
	styleUrls: [`../../../../css/component/common/chart/basic-bar-chart.component.scss`],
	template: `
		<div class="chart-container" [ngClass]="{ 'no-empty': _preventEmptyValues }" *ngIf="bars?.length">
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

	@Input() set preventEmptyValues(value: boolean) {
		this._preventEmptyValues = value;
		this.udpateStats();
	}

	bars: readonly Bar[] = [];
	_preventEmptyValues: boolean;

	private _data: SimpleBarChartData;
	private _tooltipTitle = this.i18n.translateString('app.global.graph.tooltip-title');

	constructor(private readonly i18n: LocalizationFacadeService) {}

	udpateStats() {
		if (!this._data) {
			return;
		}

		const max: number = Math.max(...this._data.data.map((data) => data.value));
		this.bars = this._data.data.map((data) => {
			const label = this.i18n.translateString('app.global.graph.wins-label', {
				value: data.label,
			});
			const value = this.i18n.translateString('app.global.graph.wins-value', {
				value: (+data.value).toFixed(1),
			});
			return {
				height: (100 * data.value) / max,
				tooltip: `
				<div class="body">
					<div class="title">${this._tooltipTitle}</div>
					<div class="label">${label}</div>
					<div class="value">${value}</div>
				</div>`,
			};
		});
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}
}

interface Bar {
	readonly height: number;
	readonly tooltip: string;
}
