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
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Label } from 'aws-sdk/clients/cloudhsm';
import { ChartData, ChartDataSets, ChartOptions, ChartTooltipItem } from 'chart.js';
import { Color } from 'ng2-charts';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { NumericTurnInfo } from '../../../models/battlegrounds/post-match/numeric-turn-info';
import { normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { thisAsThat } from '../../../services/utils';
import { areEqualDataSets } from './chart-utils';

@Component({
	selector: 'bgs-chart-hp',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-common-chart.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-hp.component.scss`,
	],
	template: `
		<div class="legend">
			<div *ngFor="let player of legend; trackBy: trackByLegendFn" class="item">
				<bgs-hero-portrait
					class="portrait"
					[heroCardId]="player.cardId"
					[cardTooltip]="player.cardId"
				></bgs-hero-portrait>
				<!-- <img [src]="player.icon" class="portrait" /> -->
				<div
					class="position"
					[ngClass]="{ 'player': player.isPlayer }"
					bindCssVariable="legend-icon-border-color"
					[bindCssVariableValue]="player.color"
				>
					#{{ player.position }}
				</div>
			</div>
			<div class="toggles">
				<div class="subtitle" [owTranslate]="'battlegrounds.post-match-stats.hp-graph.legend-title'"></div>
				<div *ngFor="let player of legend; trackBy: trackByLegendFn" class="toggle position">
					<input
						type="checkbox"
						name="player-toggled-{{ player.position }}"
						id="player-toggled-{{ player.position }}"
					/>
					<label
						for="player-toggled-{{ player.position }}"
						class="position-{{ player.position }}"
						bindCssVariable="legend-icon-border-color"
						[bindCssVariableValue]="player.color"
						(click)="togglePlayer(player.cardId)"
					>
						<p class="position-item">#{{ player.position }}</p>
						<i class="unselected" *ngIf="!player.shown">
							<svg>
								<use xlink:href="assets/svg/sprite.svg#unchecked_box" />
							</svg>
						</i>
						<i class="checked" *ngIf="player.shown">
							<svg>
								<use xlink:href="assets/svg/sprite.svg#checked_box" />
							</svg>
						</i>
					</label>
				</div>
			</div>
		</div>
		<div class="container-1">
			<div style="display: block; position: relative; height: 100%; width: 100%;">
				<canvas
					*ngIf="lineChartData?.length && lineChartData[0]?.data?.length"
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
	legend: readonly {
		cardId: string;
		icon: string;
		position: number;
		isPlayer: boolean;
		shown: boolean;
		color: string;
	}[];

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
		plugins: {
			datalabels: {
				display: false,
			},
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
			custom: thisAsThat((that: any, tooltip: any) => {
				// Tooltip Element
				const tooltipId = `chartjs-tooltip-hp-${this.tooltipSuffix ?? 'default'}`;
				let tooltipEl = document.getElementById(tooltipId);

				if (!tooltipEl) {
					tooltipEl = document.createElement('div');
					tooltipEl.id = tooltipId;
					tooltipEl.classList.add('chartjs-tooltip-hp');
					tooltipEl.innerHTML = `
						<div class="hp-tooltip">					
							<svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0"/>
							</svg>
							<div class="content"></div>
						</div>`;
					that._chart.canvas.parentNode.appendChild(tooltipEl);
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

					titleLines.forEach(function (title) {
						innerHtml += '<span>' + title + '</span>';
					});
					innerHtml += '</div>';
					innerHtml += '<div class="body">';

					bodyLines.forEach(function (body, i) {
						innerHtml += '<span class="line">' + body + '</span>';
					});
					innerHtml += '</div>';

					const tableRoot = tooltipEl.querySelector('.content');
					tableRoot.innerHTML = innerHtml;
				}

				const positionY = that._chart.canvas.offsetTop;
				const positionX = that._chart.canvas.offsetLeft;

				let position = 'bottom';
				const tooltipHeight = 220;
				if (positionY + tooltip.caretY + tooltipHeight > that._chart.canvas.height) {
					position = 'top';
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
					tooltipEl.style.bottom = positionY + that._chart.canvas.height - tooltip.caretY + 8 + 'px';
					tooltipEl.style.top = 'auto';
				}
				tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
				tooltipEl.style.fontSize = tooltip.bodyFontSize + 'px';
				tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
				tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
			}),
			callbacks: {
				title: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					return this.i18n.translateString('battlegrounds.battle.turn', { value: item[0].label });
				},
				beforeBody: (item: ChartTooltipItem[], data: ChartData): string | string[] => {
					const sortWeight = (legendItem): number => {
						const cardId = legendItem.cardId;
						const datasetIndex = data.datasets.map((dataset) => (dataset as any).cardId).indexOf(cardId);
						const playerItem = item.find((it) => it.datasetIndex === datasetIndex);
						return +playerItem?.value;
					};
					return [...this.legend]
						.sort((a, b) => sortWeight(b) - sortWeight(a))
						.map((legendItem) => {
							const cardId = legendItem.cardId;
							const datasetIndex = data.datasets
								.map((dataset) => (dataset as any).cardId)
								.indexOf(cardId);
							const playerItem = item.find((it) => it.datasetIndex === datasetIndex);
							if (!playerItem) {
								return `<div></div>`;
							}
							const color = legendItem.color;
							return `<div class="node" style="background: ${color}"></div> ${this.i18n.translateString(
								'battlegrounds.post-match-stats.hp-graph.player-health',
								{ playerName: playerItem.value },
							)}`;
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
	private _mainPlayerCardId: string;
	private _visible: boolean;
	private _dirty = true;

	@Input() set stats(value: BgsPostMatchStats) {
		this._stats = value;
		this.setStats();
	}

	@Input() set mainPlayerCardId(value: string) {
		this._mainPlayerCardId = value;
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

	@Input() tooltipSuffix = '';

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	togglePlayer(playerCardId: string) {
		this.legend = this.legend.map((playerInfo) =>
			playerInfo.cardId === playerCardId ? { ...playerInfo, shown: !playerInfo.shown } : playerInfo,
		);
		this.lineChartData = this.lineChartData.map((data) =>
			(data as any).cardId === playerCardId ? { ...data, hidden: !data.hidden } : data,
		);
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

	trackByLegendFn(
		index: number,
		player: { cardId: string; icon: string; position: number; isPlayer: boolean; shown: boolean },
	) {
		return player.cardId;
	}

	private doResize() {
		if (!this._visible) {
			this._dirty = true;
			return;
		}
		if (!this._dirty) {
			return;
		}
		if (!this.chart?.nativeElement) {
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => this.doResize(), 200);
	}

	private async setStats() {
		if (!this._stats) {
			return;
		}

		const playerOrder: readonly string[] = this.buildPlayerOrder(
			this._stats.leaderboardPositionOverTurn,
			this._stats.hpOverTurn,
		);
		console.debug('[hp-chart] playerOrder', playerOrder, this._stats);
		const hpOverTurn = {};
		for (const playerCardId of playerOrder) {
			hpOverTurn[playerCardId] = this._stats.hpOverTurn[playerCardId];
		}
		console.debug('[hp-chart] hpOverTurn', hpOverTurn);

		// It's just a way to arbitrarily always assign the same color to a player
		const sortedPlayerCardIds = [...playerOrder].sort();
		const players = playerOrder.map((cardId) => ({
			cardId: cardId,
			color: this.playerColors[sortedPlayerCardIds.indexOf(cardId)],
			position: playerOrder.indexOf(cardId) + 1,
			isPlayer: normalizeHeroCardId(cardId, this.allCards) === this._mainPlayerCardId,
			hpOverTurn:
				hpOverTurn[cardId]
					?.filter((turnInfo) => turnInfo)
					.map((turnInfo) => Math.max(0, turnInfo.value + (turnInfo.armor ?? 0))) || [],
		}));
		console.debug('[hp-chart] players', players);

		this.legend = players.map((player) => ({
			cardId: player.cardId,
			icon: this.i18n.getCardImage(player.cardId, { isBgs: true }),
			position: player.position,
			isPlayer: player.isPlayer,
			shown: true,
			color: player.color,
		}));
		console.debug('[hp-chart] legend', this.legend);
		const newChartData: ChartDataSets[] = players.map((player) => ({
			data: player.hpOverTurn,
			cardId: player.cardId,
			label: player.cardId,
			borderCapStyle: 'square',
			borderJoinStyle: 'miter',
			lineTension: 0,
			borderWidth: 2,
			hidden: false,
		}));
		if (areEqualDataSets(newChartData, this.lineChartData)) {
			return;
		}

		this.lineChartData = newChartData;
		this.lineChartColors = players.map((player) => ({
			backgroundColor: 'transparent',
			borderColor: player.color,
			pointBackgroundColor: 'transparent',
			pointBorderColor: 'transparent',
			pointHoverBackgroundColor: 'transparent',
			pointHoverBorderColor: 'transparent',
		}));
		this.lineChartLabels = this.buildChartLabels(hpOverTurn);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildPlayerOrder(
		leaderboardPositionOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] },
		hpOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] },
	): readonly string[] {
		if (!!leaderboardPositionOverTurn && Object.keys(leaderboardPositionOverTurn)?.length) {
			const lastTurn = leaderboardPositionOverTurn[0]?.length ?? 0;
			return Object.keys(leaderboardPositionOverTurn)
				.map((playerCardId) => {
					const positionAtLastTurn = leaderboardPositionOverTurn[playerCardId][lastTurn];
					return {
						playerCardId: playerCardId,
						position: positionAtLastTurn?.value ?? 99,
					};
				})
				.sort((a, b) => a.position - b.position)
				.map((info) => info.playerCardId);
		}

		// Fallback which uses the total health + armor instead of the leaderboard position
		const turnAtWhichEachPlayerDies = Object.keys(hpOverTurn)
			.filter((playerCardId) => playerCardId !== CardIds.BaconphheroHeroicBattlegrounds)
			.map((playerCardId) => {
				const info = hpOverTurn[playerCardId];
				return {
					playerCardId: playerCardId,
					turnDeath: info.find((turnInfo) => turnInfo.value <= 0)?.turn ?? 99,
					lastKnownHp: (info[info.length - 1]?.value ?? 99) + ((info[info.length - 1] as any)?.armor ?? 0),
				};
			});
		let playerOrder: string[] = turnAtWhichEachPlayerDies
			.sort(
				(a, b) =>
					b.turnDeath - a.turnDeath ||
					// a.lastKnownPosition - b.lastKnownPosition ||
					b.lastKnownHp - a.lastKnownHp,
			)
			.map((playerInfo) => playerInfo.playerCardId);
		// Legacy issue - the heroes that were offered during the hero selection phase are
		// also proposed there
		if (playerOrder.length > 8) {
			const candidatesToRemove = turnAtWhichEachPlayerDies
				.filter((info) => info.turnDeath === 99)
				.filter((info) =>
					info.playerCardId === CardIds.PatchwerkBattlegrounds
						? info.lastKnownHp === 60
						: info.lastKnownHp === 40,
				)
				.filter((info) => info.playerCardId !== this._mainPlayerCardId);
			playerOrder = playerOrder.filter(
				(playerCardId) => !candidatesToRemove.map((info) => info.playerCardId).includes(playerCardId),
			);
		}
		return playerOrder;
	}

	private buildChartLabels(value: { [playerCardId: string]: readonly NumericTurnInfo[] }): Label[] {
		if (!value || !Object.values(value)) {
			console.error('Could not build chart label for', value);
			return [];
		}
		const max: number = Math.max(
			...Object.values(value)
				.filter((turnInfos) => turnInfos)
				.map((turnInfos) => turnInfos.map((turnInfo) => turnInfo.turn))
				.reduce((a, b) => a.concat(b), [])
				.filter((turn) => turn != null),
		);
		const turns: string[] = [];
		for (let i = 0; i <= max; i++) {
			turns.push('' + i);
		}
		return turns;
	}
}
