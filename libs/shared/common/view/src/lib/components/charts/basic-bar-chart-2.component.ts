/* eslint-disable no-mixed-spaces-and-tabs */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, shareReplay, takeUntil } from 'rxjs';
import { SimpleBarChartData, SimpleBarChartDataElement } from './simple-bar-chart-data';

@Component({
	selector: 'basic-bar-chart-2',
	styleUrls: [`./basic-bar-chart-2.component.scss`],
	template: `
		<ng-container *ngIf="{ barContainers: barContainers$ | async } as value">
			<div class="chart-container" *ngIf="value.barContainers?.length">
				<div class="mid-line" [style.bottom.%]="midLineHeight$ | async"></div>
				<div class="bar-container" *ngFor="let container of value.barContainers">
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
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicBarChart2Component extends AbstractSubscriptionComponent implements AfterContentInit {
	barContainers$: Observable<readonly BarContainer[]>;
	midLineHeight$: Observable<number>;

	@Input() set data(value: readonly SimpleBarChartData[]) {
		this.chartData$$.next(value);
	}

	@Input() set tooltipTitle(value: string) {
		this.tooltipTitle$$.next(value);
	}

	@Input() set dataTextFormatter(formatter: (value: string) => string) {
		this.dataTextFormatter$$.next(formatter);
	}

	@Input() set midLineValue(value: number) {
		this.midLineValue$$.next(value);
	}

	@Input() set offsetValue(value: number) {
		this.offsetValue$$.next(value);
	}

	@Input() showLabels = true;

	private chartData$$ = new BehaviorSubject<readonly SimpleBarChartData[] | null>(null);
	private tooltipTitle$$ = new BehaviorSubject<string | null>(null);
	private dataTextFormatter$$ = new BehaviorSubject<((value: string) => string) | null>(null);
	private midLineValue$$ = new BehaviorSubject<number | null>(null);
	private offsetValue$$ = new BehaviorSubject<number>(0);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		const data$ = combineLatest([
			this.chartData$$,
			this.midLineValue$$,
			this.tooltipTitle$$,
			this.dataTextFormatter$$,
			this.offsetValue$$,
		]).pipe(
			filter(([chartData, midLineValue, tooltipTitle, dataTextFormatter, offsetValue]) => !!chartData?.length),
			this.mapData(([chartData, midLineValue, tooltipTitle, dataTextFormatter, offsetValue]) =>
				this.buildBarContainers(chartData, midLineValue, tooltipTitle, dataTextFormatter, offsetValue),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.barContainers$ = data$.pipe(this.mapData((data) => data.barContainers));
		this.midLineHeight$ = data$.pipe(this.mapData((data) => data.midLineValue));
	}

	buildBarContainers(
		chartData: readonly SimpleBarChartData[] | null,
		midLineValue: number | null,
		inputTooltipTitle: string | null,
		dataTextFormatter: ((value: string) => string) | null,
		offsetValue: number,
	): { midLineValue: number; barContainers: readonly BarContainer[] } {
		if (!chartData?.length) {
			return { midLineValue: 0, barContainers: [] };
		}
		midLineValue = midLineValue ?? 0;
		// console.debug('updating stats', chartData[0]?.data[0]?.value);
		const maxValues: readonly number[] = chartData
			.map((chartData) => chartData.data)
			.map((data: readonly SimpleBarChartDataElement[]) =>
				Math.max(
					...data
						.reduce(
							(a: readonly SimpleBarChartDataElement[], b: SimpleBarChartDataElement) => a.concat(b),
							[],
						)
						.map((element: SimpleBarChartDataElement) => element.value),
				),
			);
		const maxDataLength = Math.max(...chartData.map((chartData) => chartData.data.length));
		const barContainers: BarContainer[] = [];
		for (let i = 0; i < maxDataLength; i++) {
			const barContainer: BarContainer = this.buildBarContainer(
				chartData.map((data) => data.data[i]),
				maxValues,
				i,
				inputTooltipTitle,
				dataTextFormatter,
				offsetValue,
			);
			barContainers.push(barContainer);
		}
		// console.debug('updated stats', chartData[0]?.data[0]?.value);
		return {
			midLineValue: (100 * midLineValue) / maxValues[0],
			barContainers: barContainers,
		};
	}

	private buildBarContainer(
		elements: SimpleBarChartDataElement[],
		maxValues: readonly number[],
		xValue: number,
		inputTooltipTitle: string | null,
		dataTextFormatter: ((value: string) => string) | null,
		offsetValue: number,
	): BarContainer {
		return {
			bars: elements
				.filter((data) => !!data)
				.map((data, i) => {
					const tooltipTitle = inputTooltipTitle ? `<div class="title">${inputTooltipTitle}</div>` : '';
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
					const dataText = dataTextFormatter
						? dataTextFormatter((+data.value).toFixed(1))
						: `${(+data.value).toFixed(1)}%`;
					return {
						// Ensure a min height to make the graph look better
						height: Math.max((100 * data.value) / maxValues[i], 2),
						class: `data-${i} data-x-${xValue}`,
						tooltip: `
							<div class="body">
								${tooltipTitle}
								<div class="label">${placeLabel}</div>
								${matchesElement}
								<div class="value">${dataText}</div>
							</div>`,
					};
				}),
			label: '' + (xValue + offsetValue),
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
