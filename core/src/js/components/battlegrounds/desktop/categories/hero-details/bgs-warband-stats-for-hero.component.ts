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
import { Label } from 'aws-sdk/clients/cloudhsm';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color } from 'ng2-charts';
import { NumericTurnInfo } from '../../../../../models/battlegrounds/post-match/numeric-turn-info';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';

declare let amplitude: any;

@Component({
	selector: 'bgs-warband-stats-for-hero',
	styleUrls: [
		`../../../../../../css/global/reset-styles.scss`,
		`../../../../../../css/component/battlegrounds/hero-selection/bgs-hero-warband-stats.component.scss`,
		`../../../../../../css/component/battlegrounds/post-match/bgs-chart-warband-stats.component.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-warband-stats-for-hero.component.scss`,
	],
	template: `
		<div class="legend">
			<div
				class="item average"
				helpTooltip="Average total stats (attack + health) on board at the beginning of each turn's battle (top4 6000+ MMR)"
			>
				<div class="node"></div>
				Community
			</div>
			<div class="item current" helpTooltip="Your values for this run">
				<div class="node"></div>
				You
			</div>
		</div>
		<div class="container-1">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="lineChartData"
					#chart
					baseChart
					[style.opacity]="opacity"
					[style.width.px]="chartWidth"
					[style.height.px]="chartHeight"
					[datasets]="lineChartData"
					[labels]="lineChartLabels"
					[options]="lineChartOptions"
					[colors]="lineChartColors"
					[legend]="false"
					[chartType]="'line'"
				></canvas>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsWarbandStatsForHeroComponent {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	chartWidth: number;
	chartHeight: number;
	lineChartData: ChartDataSets[];
	lineChartLabels: Label[];
	lineChartOptions: ChartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		layout: {
			padding: 0,
		},
		scales: {
			xAxes: [
				{
					gridLines: {
						color: '#841063',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
					},
				},
			],
			yAxes: [
				{
					id: 'delta-stats',
					position: 'left',
					gridLines: {
						color: '#40032E',
					},
					ticks: {
						fontColor: '#D9C3AB',
						fontFamily: 'Open Sans',
						fontStyle: 'normal',
						beginAtZero: true,
					},
				},
			],
		},
		tooltips: {
			mode: 'index',
			position: 'nearest',
			intersect: false,
			backgroundColor: '#CE73B4',
			// titleFontSize: 0,
			titleFontFamily: 'Open Sans',
			titleFontColor: '#40032E',
			bodyFontFamily: 'Open Sans',
			bodyFontColor: '#40032E',
			xPadding: 5,
			yPadding: 5,
			caretSize: 10,
			caretPadding: 2,
			cornerRadius: 0,
			displayColors: false,
			enabled: false,
			custom: function(tooltip) {
				// console.log('requesting tooltip', tooltip, this._chart?.canvas?.parentNode);
				// Tooltip Element
				let tooltipEl = document.getElementById('chartjs-tooltip-stats');

				if (!tooltipEl) {
					tooltipEl = document.createElement('div');
					tooltipEl.id = 'chartjs-tooltip-stats';
					tooltipEl.innerHTML = `
					<div class="stats-tooltip">					
						<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
							<polygon points="0,0 8,-9 16,0"/>
						</svg>
						<div class="content"></div>
					</div>`;
					this._chart.canvas.parentNode.appendChild(tooltipEl);
					// console.log('adding tooltip el', tooltipEl);
				}
				// 230 is the current tooltip width
				const left = Math.max(
					0,
					Math.min(tooltip.caretX - 110, this._chart.canvas.parentNode.getBoundingClientRect().right - 230),
				);
				const caretOffset = tooltip.caretX - 110 - left;
				// console.log('caretOffset', caretOffset, tooltip.caretX, left);
				// console.log('svg child', tooltipEl.querySelector('.tooltip-arrow'));
				(tooltipEl.querySelector('.tooltip-arrow') as any).style.marginLeft = caretOffset + 'px';

				// Hide if no tooltip
				if (tooltip.opacity === 0) {
					tooltipEl.style.opacity = '0';
					return;
				}

				// Set Text
				if (tooltip.body) {
					// const titleLines = tooltip.title || [];
					// const bodyLines = tooltip.beforeBody;
					// console.log('adding text', tooltip, tooltip.dataPoints);

					const averageDatapoint = tooltip.dataPoints.find(dataset => dataset.datasetIndex === 0);
					const currentRunDatapoint = tooltip.dataPoints.find(dataset => dataset.datasetIndex === 1);
					const innerHtml = `
						<div class="body">
							<div class="section player">
								<div class="subtitle">You</div>
								<div class="value">Turn ${currentRunDatapoint.label}</div>
								<div class="value">Stats ${currentRunDatapoint.value}</div>
							</div>
							<div class="section average">
								<div class="subtitle">Community</div>
								<div class="value">Turn ${currentRunDatapoint.label}</div>
								<div class="value">Stats ${averageDatapoint?.value || 'No data'}</div>							
							</div>
						</div>
					`;

					const tableRoot = tooltipEl.querySelector('.content');
					tableRoot.innerHTML = innerHtml;
				}
				// console.log(
				// 	'left position',
				// 	tooltip.caretX - 110,
				// 	this._chart.canvas.parentNode,
				// 	this._chart.canvas.parentNode.getBoundingClientRect(),
				// );
				// Display, position, and set styles for font
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = left + 'px';
				tooltipEl.style.top = tooltip.caretY + 8 - 100 + 'px';
				// position === 'bottom' ? tooltip.caretY + 8 + 'px' :
				tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
				tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
				tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
				tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';

				// Set caret Position
				tooltipEl.classList.remove('above', 'below', 'no-transform');
				tooltipEl.classList.add('top');
			},
		},
	};
	lineChartColors: Color[];
	opacity: number = 0;

	private _state: MainWindowState;
	private _category: BattlegroundsPersonalStatsHeroDetailsCategory;
	private _dirty = true;

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		//console.log('setting value', value, this._globalStats);
		this._state = value;
		this.updateValues();
	}

	@Input() set category(value: BattlegroundsPersonalStatsHeroDetailsCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.updateValues();
	}

	private updateValues() {
		if (!this._state || !this._category || !this._state.battlegrounds?.lastHeroPostMatchStats) {
			return;
		}
		const averageStats: readonly {
			turn: number;
			totalStats: number;
		}[] = this._state.battlegrounds.stats.heroStats.find(stat => stat.id === 'average')?.warbandStats;
		const warbandStats: readonly NumericTurnInfo[] = this._state.battlegrounds.stats.heroStats
			.find(stat => stat.id === this._category.heroId)
			?.warbandStats?.map(stat => {
				const averageValue = averageStats.find(avg => avg.turn === stat.turn);
				if (!averageValue) {
					return null;
				}
				return {
					turn: stat.turn,
					value: stat.totalStats + averageValue.totalStats,
				} as NumericTurnInfo;
			})
			.filter(stat => stat);

		const heroStatsOverTurn: (readonly NumericTurnInfo[])[] = this._state.battlegrounds.lastHeroPostMatchStats
			.map(postMatch => postMatch.stats.totalStatsOverTurn)
			.filter(stats => stats && stats.length) as (readonly NumericTurnInfo[])[];
		const maxTurn = Math.max(...heroStatsOverTurn.map(stats => stats[stats.length - 1].turn));
		const lastTurn = Math.max(warbandStats.length, maxTurn);
		const heroStats: readonly NumericTurnInfo[] = [...Array(lastTurn).keys()]
			.map(turn => {
				const statsForTurn = heroStatsOverTurn
					.map(stats => (stats.length > turn ? stats[turn] : null))
					.filter(stat => stat)
					.map(stat => stat.value);
				return statsForTurn.length > 0
					? {
							turn: turn,
							value: statsForTurn.reduce((a, b) => a + b, 0) / statsForTurn.length,
					  }
					: null;
			})
			.filter(info => info);

		if (!warbandStats || !heroStats) {
			return;
		}
		this.lineChartLabels = [...Array(lastTurn).keys()].map(turn => '' + turn);
		this.lineChartData = [
			{
				data: warbandStats.map(stat => stat.value || 0),
				label: 'Community',
			},
			{
				data: heroStats.map(stat => stat.value),
				label: 'You',
			},
		];
		console.log('last turn is', lastTurn, this.lineChartLabels, this.lineChartData, warbandStats, heroStats);
		this.doResize();
		// console.log('[warband-stats] info computed');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {
		// this.cdr.detach();
	}

	previousWidth: number;

	@HostListener('window:resize')
	onResize() {
		this._dirty = true;
		this.doResize();
	}

	private doResize() {
		// console.log('resize in stats', this._visible, this._dirty);
		if (!this._dirty) {
			return;
		}
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
		// console.log('chartContainer', chartContainer);
		const rect = chartContainer?.getBoundingClientRect();
		if (!rect?.width || !rect?.height || !this.chart?.nativeElement?.getContext('2d')) {
			setTimeout(() => {
				this.doResize();
			}, 500);
			return;
		}
		if (rect.width === this.chartWidth && rect.height === this.chartHeight) {
			// console.log('correct container size', this.previousWidth, this.chartWidth, this.chartHeight);
			return;
		}
		// this.previousWidth = rect.width;
		this.chartWidth = rect.width;
		this.chartHeight = rect.height;
		// if (this.chartHeight > rect.height) {
		// 	this.chartHeight = rect.height;
		// 	this.chartWidth = 2 * this.chartHeight;
		// }
		this.lineChartColors = [
			{
				backgroundColor: this.getBackgroundColor(),
				borderColor: '#CE73B4',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
			{
				backgroundColor: 'transparent',
				borderColor: '#FFB948',
				pointBackgroundColor: 'transparent',
				pointBorderColor: 'transparent',
				pointHoverBackgroundColor: 'transparent',
				pointHoverBorderColor: 'transparent',
			},
		];
		this.opacity = 1;
		// console.log('setting chart dimensions', this.chartHeight, this.chartWidth);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => this.doResize(), 200);
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
		// console.log('returning gradient', gradient, this.chartHeight);
		return gradient;
	}
}
