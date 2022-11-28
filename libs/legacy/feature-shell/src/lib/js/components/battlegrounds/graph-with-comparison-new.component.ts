import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { NumericTurnInfo } from '../../models/battlegrounds/post-match/numeric-turn-info';
import { areEqualDataSets } from './post-match/chart-utils';

@Component({
	selector: 'graph-with-comparison-new',
	styleUrls: [
		`../../../css/global/reset-styles.scss`,
		`../../../css/component/battlegrounds/graph-with-comparison.component.scss`,
	],
	template: `
		<div class="legend">
			<div class="item average" [helpTooltip]="communityTooltip">
				<div class="node"></div>
				{{ communityLabel }}
			</div>
			<div class="item current" [helpTooltip]="yourTooltip" *ngIf="yourInfo">
				<div class="node"></div>
				{{ yourLabel }}
			</div>
		</div>
		<div class="container-1" [style.opacity]="opacity">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="lineChartData.datasets?.length && lineChartData.datasets[0].data?.length"
					#chart
					baseChart
					[style.width.px]="chartWidth"
					[style.height.px]="chartHeight"
					[data]="lineChartData"
					[options]="lineChartOptions"
					[legend]="false"
					[type]="'line'"
				></canvas>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphWithComparisonNewComponent {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	@Input() communityLabel = 'Community';
	@Input() yourLabel = 'You';
	@Input() communityTooltip: string;
	@Input() yourTooltip: string;
	@Input() turnLabel = 'Turn';
	@Input() statLabel = 'Stat';
	@Input() deltaLabel: string;
	@Input() id: string;
	@Input() showDeltaWithPrevious: boolean;

	@Input() set maxYValue(value: number) {
		this._maxYValue = value;
		this.updateChartOptions();
	}

	@Input() set stepSize(value: number) {
		this._stepSize = value;
		this.updateChartOptions();
	}

	@Input() set showYAxis(value: boolean) {
		this._showYAxis = value;
		this.updateChartOptions();
	}

	@Input() set communityValues(value: readonly NumericTurnInfo[]) {
		if (value === this._communityValues) {
			return;
		}
		this._communityValues = value;
		this.updateValues();
	}

	@Input() set yourValues(value: readonly NumericTurnInfo[]) {
		if (value === this._yourValues) {
			return;
		}
		this._yourValues = value;
		this.updateValues();
	}

	chartWidth: number;
	chartHeight: number;
	lineChartData: ChartData<'line'> = {
		datasets: [],
		labels: [],
	};
	lineChartOptions: ChartOptions = this.buildChartOptions();
	opacity = 0;

	yourInfo: boolean;

	private _communityValues: readonly NumericTurnInfo[];
	private _yourValues: readonly NumericTurnInfo[];
	private _dirty = true;
	private _maxYValue: number;
	private _stepSize: number;
	private _showYAxis = true;

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	private updateValues() {
		// Turn 0 is before any battle, so it's not really interesting for us
		const community = this.removeTurnZero(this._communityValues || []);
		const your = this.removeTurnZero(this._yourValues || []);
		this.yourInfo = your && your.length > 0;

		const maxTurnFromCommunity = this.getMaxTurn(community);
		const maxTurnFromYour = this.getMaxTurn(your);
		const lastTurn = Math.max(maxTurnFromCommunity, maxTurnFromYour);

		const filledCommunity = this.fillMissingData(community, lastTurn);
		const filledYour = this.fillMissingData(your, lastTurn);

		const yourData = filledYour?.map((stat) => stat.value) || [];
		const communityData = filledCommunity?.map((stat) => stat.value) || [];
		const newChartData: ChartData<'line'>['datasets'] = [
			{
				data: yourData,
				lineTension: 0,
				delta: yourData?.length
					? [yourData[0], ...yourData.slice(1).map((n, i) => (yourData[i] == null ? null : n - yourData[i]))]
					: [],
				label: this.yourLabel,
			} as any,
			{
				data: communityData,
				lineTension: 0,
				delta: communityData?.length
					? [
							communityData[0],
							...communityData
								.slice(1)
								.map((n, i) => (communityData[i] == null ? null : n - communityData[i])),
					  ]
					: [],
				label: this.communityLabel,
			},
		];
		if (areEqualDataSets(newChartData, this.lineChartData.datasets)) {
			return;
		}

		this.lineChartData = {
			datasets: newChartData,
			labels: [...Array(lastTurn + 1).keys()].filter((turn) => turn > 0).map((turn) => '' + turn),
		};

		const maxValue = Math.max(
			...newChartData.map((data) => data.data as number[]).reduce((a, b) => a.concat(b), []),
		);
		this._maxYValue = this._maxYValue ? Math.max(this._maxYValue, maxValue) : undefined;
		this.updateChartOptions();
		this.doResize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	previousWidth: number;

	@HostListener('window:resize')
	onResize() {
		this._dirty = true;
		this.doResize();
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

	private doResize() {
		if (!this._dirty) {
			return;
		}
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
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
		const gradient = this.getBackgroundColor();
		if (this.lineChartData.datasets[0]) {
			this.lineChartData.datasets[0].backgroundColor = 'transparent';
			this.lineChartData.datasets[0].borderColor = '#FFB948';
		}
		if (this.lineChartData.datasets[1]) {
			this.lineChartData.datasets[1].backgroundColor = 'gradient';
			this.lineChartData.datasets[1].borderColor = '#CE73B4';
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.opacity = gradient && this.lineChartData && this.lineChartData.datasets.length > 0 ? 1 : 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.doResize();
		}, 200);
	}

	private getBackgroundColor() {
		if (!this.chart?.nativeElement) {
			return;
		}

		const gradient = this.chart.nativeElement
			?.getContext('2d')
			?.createLinearGradient(0, 0, 0, Math.round(this.chartHeight));
		gradient.addColorStop(0, 'rgba(206, 115, 180, 1)'); // #CE73B4
		gradient.addColorStop(0.4, 'rgba(206, 115, 180, 0.4)');
		gradient.addColorStop(1, 'rgba(206, 115, 180, 0)');
		return gradient;
	}

	private getMaxTurn(input: readonly NumericTurnInfo[]) {
		return input.filter((stat) => stat.value).length === 0
			? 0
			: Math.max(...input.filter((stat) => stat.value).map((stat) => stat.turn));
	}

	private updateChartOptions() {
		this.lineChartOptions = this.buildChartOptions();
	}

	private buildChartOptions(): ChartOptions {
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
						beforeBody: function (items: TooltipItem<'line'>[]): string | string[] {
							return items?.map((item) => (item?.dataset?.label ?? []) + '|||' + item?.raw);
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

						const [yourLabel, yourDelta] = tooltip.beforeBody[0].split('|||');
						const [communityLabel, communityDelta] = tooltip.beforeBody[1]?.split('|||') ?? [];
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

						const leftOffset = yourDatapoint?.parsed != null ? 0 : 50;
						const left = Math.max(
							0,
							Math.min(
								tooltip.caretX - tooltipWidth / 2 + leftOffset,
								chartParent.getBoundingClientRect().right - tooltipWidth,
							),
						);
						// caret should always be positioned on the initial tooltip.caretX. However, since the
						// position is relative to the tooltip element, we need to do some gymnastic :)
						// 10 is because of padding
						// const carretLeftOffset = yourDatapoint?.value != null ? 0 : -50;
						const tooltipArrowEl: any = tooltipEl.querySelector('.tooltip-arrow');
						const carretLeft = tooltip.caretX - left - 8;
						tooltipArrowEl.style.left = carretLeft + 'px';

						// Display, position, and set styles for font
						tooltipEl.style.opacity = '1';
						tooltipEl.style.left = left + 'px';
						tooltipEl.style.top = tooltip.caretY + 8 - 100 + 'px';
						// tooltipEl.style.fontFamily = tooltip.options.bodyFont.
						// tooltipEl.style.fontFamily = tooltip._bodyFonFamily;
						// tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
						// tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
						// tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';

						// Set caret Position
						tooltipEl.classList.remove('above', 'below', 'no-transform');
						tooltipEl.classList.add('top');
					},
				},
			},
			scales: {
				xAxes: {
					display: this._showYAxis,
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
					display: this._showYAxis,
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
						stepSize: this._stepSize,
						callback: (value, index, ticks) => {
							if (this._showYAxis || isNaN(parseInt('' + value))) {
								return value;
							}
							return +value % this._stepSize === 0 ? value : null;
						},
					},
					beginAtZero: true,
					max: this._maxYValue,
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
