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
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Label } from 'aws-sdk/clients/cloudhsm';
import { ChartData, ChartDataSets, ChartOptions, ChartTooltipItem } from 'chart.js';
import { Color } from 'ng2-charts';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { NumericTurnInfo } from '../../../models/battlegrounds/post-match/numeric-turn-info';

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-hp',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-common-chart.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-hp.component.scss`,
	],
	template: `
		<div class="legend">
			<div *ngFor="let player of legend" class="item">
				<img [src]="player.icon" class="portrait" />
				<div class="position position-{{ player.position }}" [ngClass]="{ 'player': player.isPlayer }">
					#{{ player.position }}
				</div>
			</div>
			<div class="toggles">
				<div class="subtitle">Show me:</div>
				<div *ngFor="let player of legend" class="toggle position">
					<input
						type="checkbox"
						name="player-toggled-{{ player.position }}"
						id="player-toggled-{{ player.position }}"
					/>
					<label
						for="player-toggled-{{ player.position }}"
						class="position-{{ player.position }}"
						(click)="togglePlayer(player.cardId)"
					>
						<p class="position-item">#{{ player.position }}</p>
						<i class="unselected" *ngIf="!player.shown">
							<svg>
								<use xlink:href="/Files/assets/svg/sprite.svg#unchecked_box" />
							</svg>
						</i>
						<i class="checked" *ngIf="player.shown">
							<svg>
								<use xlink:href="/Files/assets/svg/sprite.svg#checked_box" />
							</svg>
						</i>
					</label>
				</div>
			</div>
		</div>
		<div class="container-1">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="lineChartData"
					#chart
					baseChart
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
export class BgsChartHpComponent {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	playerColors = ['#FFB948', '#FF8A48', '#42D8A2', '#55D6FF', '#4376D8', '#B346E7', '#F44CCF', '#F44C60'];
	legend: readonly { cardId: string; icon: string; position: number; isPlayer: boolean; shown: boolean }[];

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
			enabled: false,
			custom: function(tooltip) {
				// Tooltip Element
				// console.log('requesting tooltip', tooltip);
				let tooltipEl = document.getElementById('chartjs-tooltip-hp');

				if (!tooltipEl) {
					tooltipEl = document.createElement('div');
					tooltipEl.id = 'chartjs-tooltip-hp';
					tooltipEl.innerHTML = `
					<div class="hp-tooltip">					
						<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
							<polygon points="0,0 8,-9 16,0"/>
						</svg>
						<div class="content"></div>
					</div>`;
					this._chart.canvas.parentNode.appendChild(tooltipEl);
				}

				// Hide if no tooltip
				if (tooltip.opacity === 0) {
					tooltipEl.style.opacity = '0';
					return;
				}

				// Set caret Position
				tooltipEl.classList.remove('above', 'below', 'no-transform');

				// Set Text
				if (tooltip.body) {
					const titleLines = tooltip.title || [];
					const bodyLines = tooltip.beforeBody;

					let innerHtml = '<div class="title">';

					titleLines.forEach(function(title) {
						innerHtml += '<span>' + title + '</span>';
					});
					innerHtml += '</div>';
					innerHtml += '<div class="body">';

					bodyLines.forEach(function(body, i) {
						innerHtml += '<span class="line">' + body + '</span>';
					});
					innerHtml += '</div>';

					const tableRoot = tooltipEl.querySelector('.content');
					tableRoot.innerHTML = innerHtml;
				}

				const positionY = this._chart.canvas.offsetTop;
				const positionX = this._chart.canvas.offsetLeft;

				let position = 'bottom';
				// console.log(
				// 	'adjusting?',
				// 	tooltip,
				// 	this._chart.canvas.height,
				// 	positionY,
				// 	tooltip.caretY,
				// 	tooltip.height,
				// );
				const tooltipHeight = 220;
				if (positionY + tooltip.caretY + tooltipHeight > this._chart.canvas.height) {
					position = 'top';
					// console.log('will adjust');
					tooltipEl.classList.remove('bottom');
					tooltipEl.classList.add('top');
				} else {
					tooltipEl.classList.add('bottom');
					tooltipEl.classList.remove('top');
				}

				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = positionX + tooltip.caretX - 40 + 'px';
				if (position === 'bottom') {
					tooltipEl.style.top = positionY + tooltip.caretY + 8 + 'px';
					tooltipEl.style.bottom = 'auto';
				} else {
					tooltipEl.style.bottom = positionY + this._chart.canvas.height - tooltip.caretY + 8 + 'px';
					tooltipEl.style.top = 'auto';
				}
				tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
				tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
				tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
				tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
			},
			callbacks: {
				title: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					return 'Turn ' + item[0].label;
				},
				beforeBody: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					return this.legend.map(legendItem => {
						const cardId = legendItem.cardId;
						const datasetIndex = data.datasets.map(dataset => (dataset as any).cardId).indexOf(cardId);
						const playerItem = item.find(it => it.datasetIndex === datasetIndex);
						if (!playerItem) {
							return `<div></div>`;
						}
						const colorIndex = this.legend.map(leg => leg.cardId).indexOf(cardId);
						// console.log(
						// 	'before tooltip',
						// 	datasetIndex,
						// 	colorIndex,
						// 	legendItem,
						// 	item,
						// 	data,
						// 	this.legend,
						// );
						const color = this.playerColors[colorIndex];
						return `<div class="node" style="background: ${color}"></div> ${playerItem?.value} health`;
					});
				},
				label: (item: ChartTooltipItem, data: ChartData): string | string[] => {
					return null;
				},
			},
		},
	};
	lineChartColors: Color[] = [];

	private _stats: BgsPostMatchStats;
	private _game: BgsGame;
	private _visible: boolean;
	private _dirty = true;

	@Input() set stats(value: BgsPostMatchStats) {
		// console.log('setting stats', value);
		this._stats = value;
		this.setStats();
	}

	@Input() set game(value: BgsGame) {
		// console.log('setting game', value);
		this._game = value;
		this.setStats();
	}

	@Input() set visible(value: boolean) {
		if (value === this._visible) {
			return;
		}
		this._visible = value;
		if (this._visible) {
			this.doResize();
		}
	}

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: AllCardsService,
	) {}

	togglePlayer(playerCardId: string) {
		this.legend = this.legend.map(playerInfo =>
			playerInfo.cardId === playerCardId ? { ...playerInfo, shown: !playerInfo.shown } : playerInfo,
		);
		this.lineChartData = this.lineChartData.map(data =>
			(data as any).cardId === playerCardId ? { ...data, hidden: !data.hidden } : data,
		);
		// for (let i = 0; i < this.lineChartData)
		// this.lineChartColors = this.playerColors.map(color => ({
		// 	backgroundColor: 'transparent',
		// 	borderColor: color,
		// 	pointBackgroundColor: 'transparent',
		// 	pointBorderColor: 'transparent',
		// 	pointHoverBackgroundColor: 'transparent',
		// 	pointHoverBorderColor: 'transparent',
		// }));
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

	private doResize() {
		if (!this._visible) {
			this._dirty = true;
			return;
		}
		if (!this._dirty) {
			return;
		}

		// console.log('on chart hp resize');
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
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
		// console.log('chartContainer', chartContainer, rect);
		this.chartWidth = rect.width;
		this.chartHeight = rect.height;
		// if (this.chartHeight > rect.height) {
		// 	this.chartHeight = rect.height;
		// 	this.chartWidth = 2 * this.chartHeight;
		// }
		// console.log('setting chart dimensions', this.chartHeight, this.chartWidth);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => this.doResize(), 200);
	}

	private async setStats() {
		if (!this._stats || !this._game) {
			return;
		}
		const playerOrder = [...this._game.players]
			.sort((a, b) => a.leaderboardPlace - b.leaderboardPlace)
			.map(player => player.cardId);
		console.log('playerOrder', playerOrder);
		const hpOverTurn = {};
		for (const playerCardId of playerOrder) {
			hpOverTurn[playerCardId] = this._stats.hpOverTurn[playerCardId];
		}
		console.log('hpOverTurn', hpOverTurn);
		this.legend = playerOrder.map(cardId => ({
			cardId: cardId,
			icon: `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${cardId}.png`,
			position: playerOrder.indexOf(cardId) + 1,
			isPlayer: cardId === this._game.getMainPlayer().cardId,
			shown: true,
		}));

		this.lineChartData = await this.buildChartData(hpOverTurn);
		this.lineChartLabels = await this.buildChartLabels(hpOverTurn);

		this.lineChartColors = this.playerColors.map(color => ({
			backgroundColor: 'transparent',
			borderColor: color,
			pointBackgroundColor: 'transparent',
			pointBorderColor: 'transparent',
			pointHoverBackgroundColor: 'transparent',
			pointHoverBorderColor: 'transparent',
		}));
		// console.log('built line colors', this.lineChartColors);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildChartData(value: { [playerCardId: string]: readonly NumericTurnInfo[] }): ChartDataSets[] {
		if (!value || !Object.keys(value)) {
			console.error('Could not build chart data for', value);
			return [];
		}
		return Object.keys(value).map(playerId => ({
			data: value[playerId]?.map(turnInfo => turnInfo.value) || [],
			cardId: playerId,
			label: playerId,
			borderCapStyle: 'square',
			borderJoinStyle: 'miter',
			lineTension: 0,
			borderWidth: 2,
			hidden: false,
		}));
	}

	private buildChartLabels(value: { [playerCardId: string]: readonly NumericTurnInfo[] }): Label[] {
		const max: number = Math.max(
			...Object.values(value)
				.map(turnInfos => turnInfos.map(turnInfo => turnInfo.turn))
				.reduce((a, b) => a.concat(b), []),
		);
		const turns: string[] = [];
		for (let i = 0; i <= max; i++) {
			turns.push('' + i);
		}
		return turns;
	}
}
