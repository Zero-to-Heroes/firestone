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
import { DecktrackerResetDeckStatsEvent } from '../../../services/mainwindow/store/events/decktracker/decktracker-reset-deck-stats-event';
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
			<div class="controls">
				<preference-toggle
					class="percentage-toggle"
					field="desktopDeckShowMatchupAsPercentages"
					label="Show as %"
				></preference-toggle>

				<div class="reset-container">
					<button
						(mousedown)="reset()"
						helpTooltip="Reset the win/loss stats of the current deck. The previous matches will still appear in the replays tab."
					>
						<span>{{ resetText }}</span>
					</button>
					<div class="confirmation" *ngIf="showResetConfirmationText">
						Your win/loss stats have been reset.
					</div>
				</div>
			</div>
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
	_showMatchupAsPercentagesValue = true;
	matchups: readonly MatchupStat[];

	resetText = 'Reset stats';
	confirmationShown = false;
	showResetConfirmationText = false;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	async reset() {
		if (!this.confirmationShown) {
			this.confirmationShown = true;
			this.resetText = 'Are you sure?';
			return;
		}

		this.resetText = 'Reset stats';
		this.confirmationShown = false;
		this.showResetConfirmationText = true;
		this.stateUpdater.next(new DecktrackerResetDeckStatsEvent(this.deck.deckstring));
	}

	private updateValues() {
		if (!this._deck) {
			return;
		}
		const totalRow: MatchupStat = this.buildTotalRow(this._deck.matchupStats);
		this.matchups = [...this._deck.matchupStats, totalRow];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildTotalRow(matchupStats: readonly MatchupStat[]): MatchupStat {
		return {
			opponentClass: 'Total',
			totalGames: matchupStats.map((stat) => stat.totalGames).reduce((a, b) => a + b, 0),
			totalGamesCoin: matchupStats.map((stat) => stat.totalGamesCoin).reduce((a, b) => a + b, 0),
			totalGamesFirst: matchupStats.map((stat) => stat.totalGamesFirst).reduce((a, b) => a + b, 0),
			totalWins: matchupStats.map((stat) => stat.totalWins).reduce((a, b) => a + b, 0),
			totalWinsCoin: matchupStats.map((stat) => stat.totalWinsCoin).reduce((a, b) => a + b, 0),
			totalWinsFirst: matchupStats.map((stat) => stat.totalWinsFirst).reduce((a, b) => a + b, 0),
		};
	}
}
