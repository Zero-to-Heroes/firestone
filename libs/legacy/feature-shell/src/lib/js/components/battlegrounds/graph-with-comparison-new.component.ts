import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewChild
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { BehaviorSubject, combineLatest, filter, Observable, share, takeUntil } from 'rxjs';
import { NumericTurnInfo } from '../../models/battlegrounds/post-match/numeric-turn-info';

@Component({
	selector: 'graph-with-comparison-new',
	styleUrls: [`../../../css/component/battlegrounds/graph-with-comparison.component.scss`],
	template: `
		<ng-container
			*ngIf="{ lineChartData: lineChartData$ | async, lineChartOptions: lineChartOptions$ | async } as value"
		>
			<div class="legend">
				<div class="item average" [helpTooltip]="communityTooltip">
					<div class="node"></div>
					{{ communityLabel$ | async }}
				</div>
				<div
					class="item current"
					[helpTooltip]="yourTooltip"
					*ngIf="value.lineChartData?.datasets[1]?.data?.length"
				>
					<div class="node"></div>
					{{ yourLabel$ | async }}
				</div>
			</div>
			<div class="container-1">
				<div style="display: block; position: relative; height: 100%; width: 100%;">
					<canvas
						*ngIf="value.lineChartData?.datasets[0]?.data?.length"
						#chart
						baseChart
						[data]="value.lineChartData"
						[options]="value.lineChartOptions"
						[legend]="false"
						[type]="'line'"
					></canvas>
				</div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphWithComparisonNewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	lineChartData$: Observable<ChartData<'line'>>;
	lineChartOptions$: Observable<ChartOptions>;
	communityLabel$: Observable<string>;
	yourLabel$: Observable<string>;

	@Input() communityTooltip: string;
	@Input() yourTooltip: string;
	@Input() turnLabel = 'Turn';
	@Input() statLabel = 'Stat';
	@Input() deltaLabel: string;
	@Input() id: string;
	@Input() showDeltaWithPrevious: boolean;

	@Input() set maxYValue(value: number) {
		this.maxYValue$$.next(value);
	}
	@Input() set stepSize(value: number) {
		this.stepSize$$.next(value);
	}
	@Input() set showYAxis(value: boolean) {
		this.showYAxis$$.next(value);
	}

	@Input() set communityLabel(value: string) {
		this.communityLabel$$.next(value);
	}
	@Input() set yourLabel(value: string) {
		this.yourLabel$$.next(value);
	}
	@Input() set communityValues(value: readonly NumericTurnInfo[]) {
		this.communityValues$$.next(value);
	}
	@Input() set yourValues(value: readonly NumericTurnInfo[]) {
		this.yourValues$$.next(value);
	}

	private maxYValue$$ = new BehaviorSubject<number>(null);
	private stepSize$$ = new BehaviorSubject<number>(null);
	private showYAxis$$ = new BehaviorSubject<boolean>(true);

	private communityLabel$$ = new BehaviorSubject<string>('Community');
	private yourLabel$$ = new BehaviorSubject<string>('You');
	private communityValues$$ = new BehaviorSubject<readonly NumericTurnInfo[]>(null);
	private yourValues$$ = new BehaviorSubject<readonly NumericTurnInfo[]>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.communityLabel$ = this.communityLabel$$.pipe(this.mapData((info) => info));
		this.yourLabel$ = this.yourLabel$$.pipe(this.mapData((info) => info));

		this.lineChartData$ = combineLatest([
			this.communityLabel$$.asObservable(),
			this.yourLabel$$.asObservable(),
			this.communityValues$$.asObservable(),
			this.yourValues$$.asObservable(),
		]).pipe(
			this.mapData(([communityLabel, yourLabel, communityValues, yourValues]) => {
				// Turn 0 is before any battle, so it's not really interesting for us
				const community = this.removeTurnZero(communityValues || []);
				const your = this.removeTurnZero(yourValues || []);

				const maxTurnFromCommunity = this.getMaxTurn(community);
				const maxTurnFromYour = this.getMaxTurn(your);
				const lastTurn = Math.max(maxTurnFromCommunity, maxTurnFromYour);

				const filledCommunity = this.fillMissingData(community, lastTurn);
				const filledYour = this.fillMissingData(your, lastTurn);
				// console.debug('chart data', filledCommunity, filledYour, lastTurn, community, your);

				const yourData = filledYour?.map((stat) => stat.value) || [];
				const communityData = filledCommunity?.map((stat) => stat.value) || [];

				// TODO: missing color
				const newChartData: ChartData<'line'>['datasets'] = [
					{
						id: 'your',
						data: yourData,
						label: yourLabel,
						backgroundColor: 'transparent',
						borderColor: '#FFB948',
						delta: yourData?.length
							? [
									yourData[0],
									...yourData.slice(1).map((n, i) => (yourData[i] == null ? null : n - yourData[i])),
							  ]
							: [],
					} as any,
					{
						id: 'community',
						data: communityData,
						label: communityLabel,
						backgroundColor: 'transparent',
						borderColor: '#CE73B4',
						delta: communityData?.length
							? [
									communityData[0],
									...communityData
										.slice(1)
										.map((n, i) => (communityData[i] == null ? null : n - communityData[i])),
							  ]
							: [],
					} as any,
				];

				const result = {
					datasets: newChartData,
					labels: [...Array(lastTurn + 1).keys()].filter((turn) => turn > 0).map((turn) => '' + turn),
				};
				return result;
			}),
			share(),
			takeUntil(this.destroyed$),
		);
		const maxValue$ = combineLatest([this.maxYValue$$.asObservable(), this.lineChartData$]).pipe(
			filter(([maxValue, chartData]) => !!chartData),
			this.mapData(([maxYValue, chartData]) => {
				const maxValue = Math.max(
					...chartData.datasets.map((data) => data.data as number[]).reduce((a, b) => a.concat(b), []),
				);
				return !!maxYValue ? Math.max(maxYValue, maxValue) : undefined;
			}),
		);
		this.lineChartOptions$ = combineLatest([
			maxValue$,
			this.stepSize$$.asObservable(),
			this.showYAxis$$.asObservable(),
		]).pipe(
			this.mapData(([maxValue, stepSize, showYAxis]) => this.buildChartOptions(showYAxis, stepSize, maxValue)),
		);
	}

	private removeTurnZero(input: readonly NumericTurnInfo[]): readonly NumericTurnInfo[] {
		return input.filter((stat) => stat.turn > 0);
	}

	private fillMissingData(input: readonly NumericTurnInfo[], lastTurn: number) {
		const result = [];
		for (let i = 1; i <= lastTurn; i++) {
			result.push(
				input.find((stat) => stat.turn === i) || {
					turn: i,
					value: null,
				},
			);
		}
		return result;
	}

	private getMaxTurn(input: readonly NumericTurnInfo[]) {
		return input.filter((stat) => stat.value != null).length === 0
			? 0
			: Math.max(...input.filter((stat) => stat.value != null).map((stat) => stat.turn));
	}

	private buildChartOptions(showYAxis: boolean, stepSize: number, maxYValue: number): ChartOptions {
		return {
			responsive: true,
			maintainAspectRatio: false,
			layout: {
				padding: 0,
			},
			elements: {
				point: {
					radius: 0,
				},
			},
			plugins: {
				datalabels: {
					display: false,
				},
				tooltip: {
					enabled: false,
					mode: 'index',
					intersect: false,
					position: 'nearest',
					backgroundColor: '#CE73B4',
					titleColor: '#40032E',
					titleFont: {
						family: 'Open Sans',
					},
					bodyColor: '#40032E',
					bodyFont: {
						family: 'Open Sans',
					},
					padding: 5,
					caretPadding: 2,
					caretSize: 10,
					cornerRadius: 0,
					displayColors: false,
					callbacks: {
						beforeBody: (items: TooltipItem<'line'>[]): string | string[] => {
							return items?.map(
								(item: any) =>
									((item?.dataset as any)?.id ?? '') +
									'|||' +
									(item?.dataset?.label ?? '') +
									'|||' +
									item?.dataset?.delta[item.dataIndex],
							);
						},
					},
					external: (context) => {
						const tooltipId = 'chartjs-tooltip-stats-' + this.id;
						const chartParent = this.chart.nativeElement.parentNode;
						let tooltipEl = document.getElementById(tooltipId);

						if (!tooltipEl) {
							tooltipEl = document.createElement('div');
							tooltipEl.id = tooltipId;
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
						const tooltip = context.tooltip;
						if (tooltip.opacity === 0) {
							tooltipEl.style.opacity = '0';
							return;
						}

						const yourDatapoint = tooltip.dataPoints.find((dataset) => dataset.datasetIndex === 0);
						const communityDatapoint = tooltip.dataPoints.find((dataset) => dataset.datasetIndex === 1);

						let yourLabel: string = null;
						let yourDelta: string = null;
						let communityLabel: string = null;
						let communityDelta: string = null;
						for (const bBody of tooltip.beforeBody) {
							const [id, label, delta] = bBody.split('|||');
							if (id === 'your') {
								yourLabel = label;
								yourDelta = delta;
							} else {
								communityLabel = label;
								communityDelta = delta;
							}
						}

						// console.debug(
						// 	'labels',
						// 	yourLabel,
						// 	communityLabel,
						// 	tooltip.beforeBody,
						// 	yourDatapoint,
						// 	communityDatapoint,
						// );
						const playerSection = yourDatapoint?.formattedValue
							? this.buildSection(
									'player',
									yourLabel,
									this.turnLabel,
									this.statLabel,
									this.deltaLabel,
									yourDelta != null ? parseInt(yourDelta) : null,
									yourDatapoint,
							  )
							: '';
						const communitySection = communityDatapoint?.formattedValue
							? this.buildSection(
									'average',
									communityLabel,
									this.turnLabel,
									this.statLabel,
									this.deltaLabel,
									communityDelta != null ? parseInt(communityDelta) : null,
									communityDatapoint,
							  )
							: '';

						const innerHtml = `
								<div class="body">
									${playerSection}
									${communitySection}
								</div>
							`;
						const tableRoot = tooltipEl.querySelector('.content');
						tableRoot.innerHTML = innerHtml;

						const tooltipWidth = tooltipEl.getBoundingClientRect().width;
						const tooltipHeight = tooltipEl.getBoundingClientRect().height;

						const leftOffset = yourDatapoint?.parsed != null ? 0 : 50;
						const tooltipLeft = Math.max(
							0,
							Math.min(
								tooltip.caretX - tooltipWidth / 2 + leftOffset,
								chartParent.getBoundingClientRect().right - tooltipWidth,
							),
						);
						// caret should always be positioned on the initial tooltip.caretX. However, since the
						// position is relative to the tooltip element, we need to do some gymnastic :)
						// 10 is because of padding
						const tooltipArrowEl: any = tooltipEl.querySelector('.tooltip-arrow');
						const carretLeft = tooltip.caretX - tooltipLeft - 8;
						tooltipArrowEl.style.left = carretLeft + 'px';

						// Display, position, and set styles for font
						// Make sure the bottom doesn't go outside of the graph
						let tooltipTop = tooltip.y - tooltipHeight;
						const chartHeight = tooltip.chart.canvas.offsetHeight;
						if (tooltipTop + tooltipHeight > chartHeight) {
							tooltipTop = chartHeight - tooltipHeight - 25;
						}
						if (tooltipTop < 0) {
							tooltipTop = 0;
						}
						tooltipEl.style.opacity = '1';
						tooltipEl.style.left = tooltipLeft + 'px';
						tooltipEl.style.top = tooltipTop + 'px';

						// Set caret Position
						tooltipEl.classList.remove('above', 'below', 'no-transform');
						tooltipEl.classList.add('top');
					},
				},
			},
			scales: {
				xAxes: {
					display: showYAxis,
					grid: {
						color: '#841063',
					},
					ticks: {
						color: '#D9C3AB',
						font: {
							family: 'Open Sans',
							style: 'normal',
						},
					},
				},
				yAxes: {
					display: showYAxis,
					// drawBorder: this._showYAxis,
					// drawTicks: this._showYAxis,
					// offsetGridLines: this._showYAxis,
					position: 'left',
					grid: {
						color: '#40032E',
					},
					ticks: {
						color: '#D9C3AB',
						font: {
							family: 'Open Sans',
							style: 'normal',
						},
						stepSize: stepSize,
						callback: (value, index, ticks) => {
							if (showYAxis || isNaN(parseInt('' + value))) {
								return value;
							}
							return +value % stepSize === 0 ? value : null;
						},
					},
					beginAtZero: true,
					max: maxYValue,
				},
			},
		};
	}

	private buildSection(
		theClass: 'player' | 'average',
		label: string,
		turnLabel: string,
		statLabel: string,
		deltaLabel: string,
		delta: number,
		datapoint: TooltipItem<'line'>,
	): string {
		return `
			<div class="section ${theClass}">
				<div class="subtitle">${label}</div>
				<div class="value">${turnLabel} ${datapoint?.label}</div>
				<div class="value">${
					datapoint?.formattedValue
						? statLabel + ' ' + parseInt(datapoint.formattedValue).toFixed(0)
						: 'No data'
				}</div>
				<div class="delta">${
					this.showDeltaWithPrevious && delta != null
						? deltaLabel.replace('{{delta}}', '' + delta.toFixed(0))
						: ''
				}</div>
			</div>
		`;
	}
}
