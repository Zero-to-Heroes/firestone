import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { MatchupStat } from '../../../models/mainwindow/stats/matchup-stat';
import { formatClass } from '../../../services/hs-utils';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'deck-matchup-info',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/deck-matchup-info.component.scss`,
	],
	template: `
		<div class="deck-matchup-info">
			<div class="cell class">
				<img class="icon" [src]="icon" [helpTooltip]="className" *ngIf="icon" />
				<div class="class-name" *ngIf="!icon">{{ className }}</div>
			</div>
			<div class="cell total-games">{{ games }}</div>
			<div
				class="cell winrate"
				[ngClass]="{ 'positive': winrate > 51, 'negative': winrate < 49 }"
				*ngIf="_showMatchupAsPercentages"
			>
				{{ buildValue(winrate) }}
			</div>
			<div
				class="cell winrate-first"
				[ngClass]="{ 'positive': winrateFirst > 51, 'negative': winrateFirst < 49 }"
				*ngIf="_showMatchupAsPercentages"
				[helpTooltip]="winrateFirstTooltip"
			>
				{{ buildValue(winrateFirst) }}
			</div>
			<div
				class="cell winrate-coin"
				[ngClass]="{ 'positive': winrateCoin > 51, 'negative': winrateCoin < 49 }"
				*ngIf="_showMatchupAsPercentages"
				[helpTooltip]="winrateCoinTooltip"
			>
				{{ buildValue(winrateCoin) }}
			</div>

			<div class="cell winrate number" *ngIf="!_showMatchupAsPercentages">
				<span class="wins" *ngIf="wins > 0 || losses > 0">{{ wins }}</span>
				<span class="separator">-</span>
				<span class="losses" *ngIf="wins > 0 || losses > 0">{{ losses }}</span>
			</div>
			<div
				class="cell winrate-first number"
				*ngIf="!_showMatchupAsPercentages"
				[helpTooltip]="winrateFirstTooltip"
			>
				<span class="wins" *ngIf="winsFirst > 0 || lossesFirst > 0">{{ winsFirst }}</span>
				<span class="separator">-</span>
				<span class="losses" *ngIf="winsFirst > 0 || lossesFirst > 0">{{ lossesFirst }}</span>
			</div>
			<div class="cell winrate-coin number" *ngIf="!_showMatchupAsPercentages" [helpTooltip]="winrateCoinTooltip">
				<span class="wins" *ngIf="winsSecond > 0 || lossesSecond > 0">{{ winsSecond }}</span>
				<span class="separator">-</span>
				<span class="losses" *ngIf="winsSecond > 0 || lossesSecond > 0">{{ lossesSecond }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckMatchupInfoComponent implements AfterViewInit {
	@Input() set matchup(value: MatchupStat) {
		this._matchup = value;
		this.updateInfos();
	}

	@Input() set showMatchupAsPercentages(value: boolean) {
		this._showMatchupAsPercentages = value;
		this.updateInfos();
	}

	icon: string;
	className: string;
	games: number;
	_showMatchupAsPercentages = true;

	winrate: number;
	winrateFirst: number;
	winrateFirstTooltip: string;
	winrateCoin: number;
	winrateCoinTooltip: string;

	wins: number;
	losses: number;
	winsFirst: number;
	lossesFirst: number;
	winsSecond: number;
	lossesSecond: number;

	private _matchup: MatchupStat;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildValue(value: number): string {
		return value == null ? '-' : value.toFixed(0) + '%';
	}

	private updateInfos() {
		if (!this._matchup) {
			return;
		}

		const isTotalRow = this._matchup.opponentClass.toLowerCase() === 'total';
		this.icon = isTotalRow ? null : `assets/images/deck/classes/${this._matchup.opponentClass.toLowerCase()}.png`;
		this.className = formatClass(this._matchup.opponentClass);
		this.games = this._matchup.totalGames;
		this.wins = this._matchup.totalWins;
		this.losses = this._matchup.totalGames - this._matchup.totalWins;
		this.winsFirst = this._matchup.totalWinsFirst;
		this.lossesFirst = this._matchup.totalGamesFirst - this._matchup.totalWinsFirst;
		this.winsSecond = this._matchup.totalWinsCoin;
		this.lossesSecond = this._matchup.totalGamesCoin - this._matchup.totalWinsCoin;
		this.winrate =
			this._matchup.totalWins != null && this._matchup.totalGames
				? (100 * this._matchup.totalWins) / this._matchup.totalGames
				: null;
		this.winrateFirst =
			this._matchup.totalWinsFirst != null && this._matchup.totalGamesFirst
				? (100 * this._matchup.totalWinsFirst) / this._matchup.totalGamesFirst
				: null;
		this.winrateFirstTooltip = `Played ${this._matchup.totalGamesFirst} matches going first`;
		this.winrateCoin =
			this._matchup.totalWinsCoin != null && this._matchup.totalGamesCoin
				? (100 * this._matchup.totalWinsCoin) / this._matchup.totalGamesCoin
				: null;
		this.winrateCoinTooltip = `Played ${this._matchup.totalGamesCoin} matches going second`;
	}
}
