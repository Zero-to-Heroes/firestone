import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsHeroPlayerStat } from '../../../models/duels/duels-player-stats';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { SimpleBarChartData } from '../../common/chart/simple-bar-chart-data';

@Component({
	selector: 'duels-hero-stat-vignette',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-hero-stat-vignette.component.scss`,
	],
	template: `
		<div class="duels-hero-stat-vignette" [ngClass]="{ 'unused': playerGamesPlayed === 0 }">
			<div class="box-side">
				<div class="name-container">
					<div class="name" [helpTooltip]="playerClass + ' - ' + name">{{ name }}</div>
					<div class="info" [helpTooltip]="numberOfGamesTooltip">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#info" />
						</svg>
					</div>
				</div>
				<img [src]="icon" class="portrait" [cardTooltip]="cardId" />
				<div class="stats">
					<basic-bar-chart
						*ngIf="globalWinDistribution?.data?.length > 0"
						class="win-distribution"
						[data]="globalWinDistribution"
						[id]="'duels-hero-vignette' + _stat.cardId"
						tooltipTitle="Win distribution"
					></basic-bar-chart>
					<div class="item winrate">
						<div class="label">Global winrate</div>
						<div class="values">
							<div class="value player">{{ buildPercents(globalWinrate) }}</div>
						</div>
					</div>
					<div class="item winrate">
						<div class="label">Your winrate</div>
						<div class="values">
							<div class="value player">
								{{ playerWinrate != null ? buildPercents(playerWinrate) : '--' }}
							</div>
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
		if (!value || value === this._stat) {
			return;
		}
		const card = value.cardId ? this.cards.getCard(value.cardId) : null;
		this._stat = value;
		this.cardId = value.cardId;
		this.name = card?.name;
		this.playerClass = card?.playerClass;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.playerWinrate = value.playerWinrate;
		this.globalWinrate = value.globalWinrate;
		this.playerGamesPlayed = value.playerTotalMatches || 0;
		this.globalWinDistribution = {
			data:
				value.globalWinDistribution?.map((input) => ({
					label: '' + input.winNumber,
					// To never show an empty bar
					value: Math.max(input.value, 0.5),
				})) ?? [],
		} as SimpleBarChartData;
		this.numberOfGamesTooltip = `${value.globalTotalMatches.toLocaleString()} runs recorded (${this.buildPercents(
			value.globalPopularity,
		)} popularity)`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
	numberOfGamesTooltip: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(decimal);
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
