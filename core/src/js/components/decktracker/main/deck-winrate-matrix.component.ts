import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MatchupStat } from '../../../models/mainwindow/stats/matchup-stat';
import { DesktopDecktrackerChangeMatchupAsPercentagesEvent } from '../../../services/mainwindow/store/events/decktracker/desktop-decktracker-change-matchup-as-percentage-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'deck-winrate-matrix',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/deck-winrate-matrix.component.scss`,
	],
	template: `
		<div class="deck-winrate-matrix">
			<div class="header">
				<div class="cell class"></div>
				<div class="cell total-games">Total matches</div>
				<div class="cell winrate">{{ showMatchupAsPercentages ? 'Win%' : 'Wins' }}</div>
				<div class="cell winrate">{{ showMatchupAsPercentages ? 'Win% Play' : 'Wins Play' }}</div>
				<div class="cell winrate">{{ showMatchupAsPercentages ? 'Win% Coin' : 'Wins Coin' }}</div>
			</div>
			<deck-matchup-info
				*ngFor="let matchup of matchups"
				[matchup]="matchup"
				[showMatchupAsPercentages]="showMatchupAsPercentages"
				[ngClass]="{ 'no-data': !matchup.totalGames }"
			></deck-matchup-info>
			<preference-toggle
				class="percentage-toggle"
				field="desktopDeckShowMatchupAsPercentages"
				label="Show as %"
				[toggleFunction]="toggleShowAsPercentage"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckWinrateMatrixComponent implements AfterViewInit {
	@Input() set deck(value: DeckSummary) {
		this._deck = value;
		// console.log('setting deck', value);
		this.updateValues();
	}

	@Input() showMatchupAsPercentages: boolean = true;

	_deck: DeckSummary;
	matchups: readonly MatchupStat[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowAsPercentage = (newValue: boolean) => {
		this.stateUpdater.next(new DesktopDecktrackerChangeMatchupAsPercentagesEvent(newValue));
	};

	private updateValues() {
		if (!this._deck) {
			return;
		}
		// console.log('will build matchups', this._deck.matchupStats);
		this.matchups = this._deck.matchupStats;
		// console.log('matchups', this.matchups);
	}
}
