/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, filter, tap } from 'rxjs';

@Component({
	selector: 'mulligan-detailed-info',
	styleUrls: [`./mulligan-detailed-info.component.scss`],
	template: `
		<div class="title" [fsTranslate]="'decktracker.overlay.mulligan.deck-mulligan-overview-title'"></div>
		<div class="chart-container" *ngIf="barContainers$ | async as bars">
			<div
				class="bar {{ bar.class }}"
				*ngFor="let bar of bars"
				[ngClass]="{ negative: bar.value < 0 }"
				[style.height.%]="bar.height"
				[style.bottom.%]="bar.offset * 100"
				[cardTooltip]="bar.cardId"
			>
				<div class="label">{{ bar.label }}</div>
			</div>
		</div>
		<div class="footer">{{ footerText$ | async }}</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MulliganDetailedInfoComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	barContainers$: Observable<readonly Bar[] | null | undefined>;
	footerText$: Observable<string | null>;

	@Input() set data(value: MulliganChartData | null) {
		this.chartData$$.next(value);
	}

	private chartData$$ = new BehaviorSubject<MulliganChartData | null | undefined>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.barContainers$ = this.chartData$$.pipe(
			filter((data) => !!data?.mulliganData?.length),
			this.mapData((chartData) => {
				const maxValue = chartData!.mulliganData.map((data) => data.value).reduce((a, b) => Math.max(a, b), 0);
				const minValue = chartData!.mulliganData.map((data) => data.value).reduce((a, b) => Math.min(a, b), 0);
				const amplitude = maxValue - minValue;
				return chartData?.mulliganData.map((data) => ({
					cardId: data.cardId,
					value: data.value,
					height: 100 * Math.abs(data.value / amplitude),
					offset: (data.value < 0 ? data.value - minValue : -minValue) / amplitude,
					class: data.selected ? 'selected' : '',
					label: data.value.toFixed(2),
				}));
			}),
			tap((data) => console.debug('[mulligan-detailed-info] barContainers', data)),
		);
		this.footerText$ = this.chartData$$.pipe(
			this.mapData((data) => {
				return data
					? this.i18n.translateString('decktracker.overlay.mulligan.deck-mulligan-overview-footer', {
							sampleSize: data.sampleSize.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
							rankBracket: this.i18n.translateString(
								`app.decktracker.filters.rank-bracket.${data.rankBracket}`,
							),
							opponentClass: this.i18n.translateString(`global.class.${data.opponentClass}`),
							format: this.i18n.translateString(`global.format.${data.format}`),
					  })
					: null;
			}),
		);
	}

	// private buildBarContainer(
	// 	elements: SimpleBarChartDataElement[],
	// 	maxValues: readonly number[],
	// 	xValue: number,
	// ): BarContainer {
	// 	return {
	// 		bars: elements
	// 			.filter((data) => !!data)
	// 			.map((data, i) => {
	// 				const tooltipTitle = this._tooltipTitle ? `<div class="title">${this._tooltipTitle}</div>` : '';
	// 				const placeLabel = this.i18n.translateString('battlegrounds.hero-stats.place', {
	// 					value: data.label,
	// 				});
	// 				const matchesLabel =
	// 					data.rawValue != null
	// 						? this.i18n.translateString('battlegrounds.hero-selection.total-matches', {
	// 								value: data.rawValue,
	// 						  })
	// 						: null;
	// 				const matchesElement = !!matchesLabel ? `<div class="raw-value">${matchesLabel}</div>` : '';
	// 				const dataText = this._dataTextFormatter
	// 					? this._dataTextFormatter((+data.value).toFixed(1))
	// 					: `${(+data.value).toFixed(1)}%`;
	// 				return {
	// 					// Ensure a min height to make the graph look better
	// 					height: Math.max((100 * data.value) / maxValues[i], 2),
	// 					class: `data-${i} data-x-${xValue}`,
	// 					tooltip: `
	// 						<div class="body">
	// 							${tooltipTitle}
	// 							<div class="label">${placeLabel}</div>
	// 							${matchesElement}
	// 							<div class="value">${dataText}</div>
	// 						</div>`,
	// 				};
	// 			}),
	// 		label: '' + (xValue + this._offsetValue),
	// 	} as BarContainer;
	// }
}

// interface BarContainer {
// 	readonly bars: Bar[];
// 	readonly label: string;
// }

export interface MulliganChartData {
	readonly mulliganData: readonly MulliganChartDataCard[];
	readonly sampleSize: number;
	readonly format: string;
	readonly rankBracket: string;
	readonly opponentClass: string;
}

export interface MulliganChartDataCard {
	readonly cardId: string;
	readonly label: string;
	readonly value: number;
	readonly rawValue?: number;
	readonly keepRate?: number | null;
	readonly selected: boolean;
}

interface Bar {
	readonly value: number;
	readonly height: number;
	readonly class: string;
	readonly offset: number;
	readonly cardId: string;
	readonly label: string;
	// readonly tooltip: string;
}
