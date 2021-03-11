import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MatchupStat } from '../../../models/mainwindow/stats/matchup-stat';
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
				<div class="cell winrate">{{ _showMatchupAsPercentagesValue ? 'Win%' : 'Wins' }}</div>
				<div class="cell winrate">{{ _showMatchupAsPercentagesValue ? 'Win% Play' : 'Wins Play' }}</div>
				<div class="cell winrate">{{ _showMatchupAsPercentagesValue ? 'Win% Coin' : 'Wins Coin' }}</div>
			</div>
			<deck-matchup-info
				*ngFor="let matchup of matchups"
				[matchup]="matchup"
				[showMatchupAsPercentages]="_showMatchupAsPercentagesValue"
				[ngClass]="{ 'no-data': !matchup.totalGames }"
			></deck-matchup-info>
			<preference-toggle
				class="percentage-toggle"
				field="desktopDeckShowMatchupAsPercentages"
				label="Show as %"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckWinrateMatrixComponent implements AfterViewInit {
	@Input() set deck(value: DeckSummary) {
		this._deck = value;
		this.updateValues();
	}

	@Input() set showMatchupAsPercentagesValue(value: boolean) {
		this._showMatchupAsPercentagesValue = value;
		this.updateValues();
	}

	_deck: DeckSummary;
	_showMatchupAsPercentagesValue: boolean = true;
	matchups: readonly MatchupStat[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._deck) {
			return;
		}
		this.matchups = this._deck.matchupStats;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
