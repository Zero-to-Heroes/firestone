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
				<img class="icon" [src]="icon" [helpTooltip]="className" />
			</div>
			<div class="cell total-games">{{ games }}</div>
			<div class="cell winrate">{{ buildValue(winrate) }}</div>
			<div class="cell winrate-first" [helpTooltip]="winrateFirstTooltip">{{ buildValue(winrateFirst) }}</div>
			<div class="cell winrate-coin" [helpTooltip]="winrateCoinTooltip">{{ buildValue(winrateCoin) }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckMatchupInfoComponent implements AfterViewInit {
	@Input() set matchup(value: MatchupStat) {
		this.icon = `assets/images/deck/classes/${value.opponentClass.toLowerCase()}.png`;
		this.className = formatClass(value.opponentClass);
		this.games = value.totalGames;
		this.winrate = value.totalWins != null && value.totalGames ? (100 * value.totalWins) / value.totalGames : null;
		this.winrateFirst =
			value.totalWinsFirst != null && value.totalGamesFirst
				? (100 * value.totalWinsFirst) / value.totalGamesFirst
				: null;
		this.winrateFirstTooltip = `Played ${value.totalGamesFirst} matches going first`;
		this.winrateCoin =
			value.totalWinsCoin != null && value.totalGamesCoin
				? (100 * value.totalWinsCoin) / value.totalGamesCoin
				: null;
		this.winrateCoinTooltip = `Played ${value.totalGamesCoin} matches going second`;
	}

	icon: string;
	className: string;
	games: number;
	winrate: number;
	winrateFirst: number;
	winrateFirstTooltip: string;
	winrateCoin: number;
	winrateCoinTooltip: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildValue(value: number): string {
		return value == null ? '-' : value.toFixed(0) + '%';
	}
}
