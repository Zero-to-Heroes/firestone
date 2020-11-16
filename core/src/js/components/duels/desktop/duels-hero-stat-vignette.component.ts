import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { SimpleBarChartData } from '../../common/chart/simple-bar-chart-data';

@Component({
	selector: 'duels-hero-stat-vignette',
	styleUrls: [
		`../../../../css/component/duels/desktop/duels-hero-stat-vignette.component.scss`,
		`../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="duels-hero-stat-vignette" [ngClass]="{ 'unused': playerGamesPlayed === 0 }">
			<div class="box-side">
				<div class="name" [helpTooltip]="playerClass + ' - ' + name">{{ name }}</div>
				<img [src]="icon" class="portrait" [cardTooltip]="cardId" />
				<div class="stats">
					<simple-bar-chart
						*ngIf="globalWinDistribution?.data?.length > 0"
						class="win-distribution"
						[data]="globalWinDistribution"
						[id]="'duels-hero-vignette' + _stat.cardId"
						tooltipTitle="Win distribution"
					></simple-bar-chart>
					<div class="item winrate">
						<div class="label">Global winrate</div>
						<div class="values">
							<div class="value player">{{ buildPercents(globalWinrate) }}</div>
							<!-- <duels-global-value [value]="buildPercents(globalWinrate)"></duels-global-value> -->
						</div>
					</div>
					<div class="item winrate">
						<div class="label">Your winrate</div>
						<div class="values">
							<div class="value player">{{ buildPercents(playerWinrate) }}</div>
							<!-- <duels-global-value [value]="buildPercents(globalWinrate)"></duels-global-value> -->
						</div>
					</div>
					<div class="stats">
						<div class="item popularity">
							<div class="label">Games played</div>
							<div class="values">
								<div class="value player">{{ buildValue(playerGamesPlayed, 0) }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroStatVignetteComponent implements AfterViewInit {
	@Input() set stat(value: DuelsHeroPlayerStat) {
		// console.log('setting stats', value);
		if (!value || value === this._stat) {
			return;
		}
		this._stat = value;
		this.cardId = value.cardId;
		this.name = this.cards.getCard(value.cardId)?.name;
		this.playerClass = this.cards.getCard(value.cardId)?.playerClass;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.playerWinrate = value.playerWinrate;
		this.globalWinrate = value.globalWinrate;
		this.playerGamesPlayed = value.playerTotalMatches || 0;
		this.globalWinDistribution = {
			data: value.globalWinDistribution.map(input => ({
				label: '' + input.winNumber,
				value: input.value,
			})),
		} as SimpleBarChartData;
	}

	_stat: DuelsHeroPlayerStat;
	cardId: string;
	name: string;
	playerClass: string;
	icon: string;
	playerWinrate: number;
	globalWinrate: number;
	playerGamesPlayed: number;
	globalWinDistribution: SimpleBarChartData;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cards: AllCardsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildPercents(value: number): string {
		return value == null ? 'N/A' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? 'N/A' : value === 0 ? '0' : value.toFixed(decimal);
	}
}

@Component({
	selector: 'duels-global-value',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-hero-stat-vignette.component.scss`,
	],
	template: `
		<div class="global-value" helpTooltip="Average value for the community">
			<div class="global-icon">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#global" />
				</svg>
			</div>
			<span class="value">{{ value }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsGlobalValueComponent {
	@Input() value: string;
}
