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
import { classesForPieChart, colorForClass, formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { DecktrackerDeleteDeckEvent } from '../../../services/mainwindow/store/events/decktracker/decktracker-delete-deck-event';
import { DecktrackerResetDeckStatsEvent } from '../../../services/mainwindow/store/events/decktracker/decktracker-reset-deck-stats-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { InputPieChartData, InputPieChartOptions } from '../../common/chart/input-pie-chart-data';

@Component({
	selector: 'deck-winrate-matrix',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/deck-winrate-matrix.component.scss`,
	],
	template: `
		<div class="opponents-popularity">
			<div class="title">Opponent class breakdown</div>
			<pie-chart class="opponents-popularity-chart" [data]="pieChartData" [options]="pieChartOptions"></pie-chart>
		</div>
		<div class="deck-winrate-matrix">
			<div class="header ">
				<div class="cell class"></div>
				<div class="cell total-games" [owTranslate]="'app.decktracker.matchup-info.total-matches-header'"></div>
				<div
					class="cell winrate"
					[owTranslate]="
						_showMatchupAsPercentagesValue
							? 'app.decktracker.matchup-info.win-percent-header'
							: 'app.decktracker.matchup-info.win-total-header'
					"
				></div>
				<div
					class="cell winrate"
					[owTranslate]="
						_showMatchupAsPercentagesValue
							? 'app.decktracker.matchup-info.win-play-percent-header'
							: 'app.decktracker.matchup-info.win-play-total-header'
					"
				></div>
				<div
					class="cell winrate"
					[owTranslate]="
						_showMatchupAsPercentagesValue
							? 'app.decktracker.matchup-info.win-coin-percent-header'
							: 'app.decktracker.matchup-info.win-coin-total-header'
					"
				></div>
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
					[label]="'app.decktracker.matchup-info.show-as-percent-button-label' | owTranslate"
				></preference-toggle>

				<div class="reset-container">
					<button
						(mousedown)="reset()"
						[helpTooltip]="'app.decktracker.matchup-info.reset-button-tooltip' | owTranslate"
					>
						<span>{{ resetText }}</span>
					</button>
					<div
						class="confirmation"
						*ngIf="showResetConfirmationText"
						[owTranslate]="'app.decktracker.matchup-info.reset-confirmation'"
					></div>
				</div>
				<div class="delete-container">
					<button
						confirmationTooltip
						[askConfirmation]="true"
						[validButtonText]="'app.decktracker.matchup-info.delete-button-step-2' | owTranslate"
						[confirmationText]="'app.decktracker.matchup-info.delete-confirmation' | owTranslate"
						(onConfirm)="deleteDeck()"
						[helpTooltip]="'app.decktracker.matchup-info.delete-tooltip' | owTranslate"
					>
						<span>{{ deleteText }}</span>
					</button>
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
	pieChartData: readonly InputPieChartData[];
	pieChartOptions: InputPieChartOptions;

	resetText = 'Reset stats';
	deleteText = 'Delete deck';
	confirmationShown = false;
	showResetConfirmationText = false;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	async reset() {
		console.debug('resetting deck stats', this._deck);
		if (!this._deck) {
			return;
		}

		if (!this.confirmationShown) {
			console.debug('showing confirmation', this.confirmationShown);
			this.confirmationShown = true;
			this.resetText = this.i18n.translateString('app.decktracker.matchup-info.reset-are-you-sure');
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}

		this.resetText = this.i18n.translateString('app.decktracker.matchup-info.reset-button-label');
		this.confirmationShown = false;
		this.showResetConfirmationText = true;
		this.stateUpdater.next(new DecktrackerResetDeckStatsEvent(this._deck.deckstring));
	}

	deleteDeck() {
		console.log('deleting deck', this._deck.deckstring);
		this.stateUpdater.next(new DecktrackerDeleteDeckEvent(this._deck.deckstring));
	}

	private updateValues() {
		if (!this._deck) {
			return;
		}
		const totalRow: MatchupStat = this.buildTotalRow(this._deck.matchupStats);
		this.matchups = [...this._deck.matchupStats, totalRow];
		this.pieChartData = this.buildPieChartData();
		this.pieChartOptions = this.buildPieChartOptions();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildPieChartOptions(): InputPieChartOptions {
		return {
			padding: {
				top: 50,
				bottom: 50,
				left: 50,
				right: 100,
			},
			showAllLabels: true,
			aspectRatio: 1,
			tooltipFontSize: 16,
		};
	}

	private buildPieChartData(): readonly InputPieChartData[] {
		return classesForPieChart.map((className) => {
			return {
				label: formatClass(className, this.i18n),
				data: this.matchups.find((matchup) => matchup.opponentClass === className)?.totalGames ?? 0,
				color: `${colorForClass(className)}`,
			};
		});
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
