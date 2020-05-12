import {
	AfterViewInit,
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
export class BgsChartHpComponent implements AfterViewInit {
	@ViewChild('chart', { static: false }) chart: ElementRef;

	playerColors = ['#FFB948', '#FF8A48', '#42D8A2', '#55D6FF', '#4376D8', '#B346E7', '#F44CCF', '#F44C60'];
	legend: readonly { cardId: string; icon: string; position: number; isPlayer: boolean }[];

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
			enabled: false,
			custom: function(tooltip) {
				// Tooltip Element
				var tooltipEl = document.getElementById('chartjs-tooltip');

				if (!tooltipEl) {
					tooltipEl = document.createElement('div');
					tooltipEl.id = 'chartjs-tooltip';
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
				// if (tooltip.opacity === 0) {
				// 	tooltipEl.style.opacity = '0';
				// 	return;
				// }

				// Set caret Position
				tooltipEl.classList.remove('above', 'below', 'no-transform');
				if (tooltip.yAlign) {
					tooltipEl.classList.add(tooltip.yAlign);
				} else {
					tooltipEl.classList.add('no-transform');
				}

				// Set Text
				if (tooltip.body) {
					var titleLines = tooltip.title || [];
					var bodyLines = tooltip.beforeBody;

					var innerHtml = '<div class="title">';

					titleLines.forEach(function(title) {
						innerHtml += '<span>' + title + '</span>';
					});
					innerHtml += '</div>';
					innerHtml += '<div class="body">';

					bodyLines.forEach(function(body, i) {
						var colors = tooltip.labelColors[i];
						// console.log('colors for', i, colors, body);
						innerHtml += '<span class="line">' + body + '</span>';
					});
					innerHtml += '</div>';

					var tableRoot = tooltipEl.querySelector('.content');
					tableRoot.innerHTML = innerHtml;
				}

				var positionY = this._chart.canvas.offsetTop;
				var positionX = this._chart.canvas.offsetLeft;

				var position = 'bottom';
				console.log(
					'adjusting?',
					tooltip,
					this._chart.canvas.height,
					positionY,
					tooltip.caretY,
					tooltip.height,
				);
				const tooltipHeight = 220;
				if (positionY + tooltip.caretY + tooltipHeight > this._chart.canvas.height) {
					position = 'top';
					console.log('will adjust');
					tooltipEl.classList.remove('bottom');
					tooltipEl.classList.add('top');
				} else {
					tooltipEl.classList.add('bottom');
					tooltipEl.classList.remove('top');
				}

				// console.log('top', positionY, tooltip.caretY, this._chart.canvas.getBoundingClientRect(), tooltip);
				// Display, position, and set styles for font
				tooltipEl.style.opacity = '1';
				tooltipEl.style.left = positionX + tooltip.caretX - 40 + 'px';
				tooltipEl.style.top =
					position === 'bottom'
						? positionY + tooltip.caretY + 4 + 'px'
						: positionY + tooltip.caretY + 4 - 203 + 24 + 'px';
				tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
				tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
				tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
				tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
			},
			callbacks: {
				title: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					console.log('title for', item, data);
					return 'Turn ' + item[0].label;
					// return data.datasets[item[0].datasetIndex].label;
				},
				beforeBody: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					return this.legend.map(legendItem => {
						const cardId = legendItem.cardId;
						const datasetIndex = data.datasets.map(dataset => (dataset as any).cardId).indexOf(cardId);
						const dataForPlayer = data.datasets[datasetIndex];
						// console.log(
						// 	'dataForPlayer',
						// 	dataForPlayer,
						// 	datasetIndex,
						// 	cardId,
						// 	data.datasets.map(dataset => (dataset as any).cardId),
						// );
						const playerName = this.allCards.getCard((dataForPlayer as any).cardId).name;
						const playerItem = item[datasetIndex];
						const color = this.playerColors[datasetIndex];
						return `<div class="node" style="background: ${color}"></div> ${playerItem.value} health`;
					});
				},
				label: (item: ChartTooltipItem, data: ChartData): string | string[] => {
					// console.log('label for', item, data);
					return null;
				},
			},
		},
	};
	lineChartColors: Color[] = [];

	private _stats: BgsPostMatchStats;
	private _game: BgsGame;

	@Input() set stats(value: BgsPostMatchStats) {
		console.log('setting stats', value);
		this._stats = value;
		this.setStats();
	}

	@Input() set game(value: BgsGame) {
		console.log('setting game', value);
		this._game = value;
		this.setStats();
	}

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: AllCardsService,
	) {}

	async ngAfterViewInit() {
		this.onResize();
		if (!this.chartHeight || !this.chart?.nativeElement?.getContext('2d')) {
			// console.log('chart not present', this.chartHeight, this.chart);
			setTimeout(() => this.ngAfterViewInit(), 200);
			return;
		}
	}

	previousWidth: number;

	@HostListener('window:resize')
	onResize() {
		const chartContainer = this.el.nativeElement.querySelector('.container-1');
		const rect = chartContainer?.getBoundingClientRect();
		if (!rect?.width || !rect?.height || !this.chart?.nativeElement?.getContext('2d')) {
			setTimeout(() => {
				this.onResize();
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
		setTimeout(() => this.onResize(), 200);
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
		for (let playerCardId of playerOrder) {
			hpOverTurn[playerCardId] = this._stats.hpOverTurn[playerCardId];
		}
		console.log('hpOverTurn', hpOverTurn);
		this.legend = playerOrder.map(cardId => ({
			cardId: cardId,
			icon: `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${cardId}.png`,
			position: playerOrder.indexOf(cardId) + 1,
			isPlayer: cardId === this._game.getMainPlayer().cardId,
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
		return Object.keys(value).map(playerId => ({
			data: value[playerId].map(turnInfo => turnInfo.value),
			cardId: playerId,
			label: playerId,
			borderCapStyle: 'square',
			borderJoinStyle: 'miter',
			lineTension: 0,
			borderWidth: 2,
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
