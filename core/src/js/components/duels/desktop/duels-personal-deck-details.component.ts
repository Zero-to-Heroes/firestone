import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { DuelsDeckSummary } from '../../../models/duels/duels-personal-deck';
import { DuelsRun } from '../../../models/duels/duels-run';
import { DuelsState } from '../../../models/duels/duels-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-personal-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-personal-deck-details.component.scss`,
	],
	template: `
		<div class="duels-personal-deck-details">
			<div class="deck-list-container">
				<div class="deck-selection">
					<input
						type="radio"
						name="deck"
						id="initial"
						value="initial"
						[checked]="currentDeck === 'initial'"
						(change)="changeCurrentDeck($event)"
					/>
					<label for="initial">
						<div class="icon unchecked" inlineSVG="assets/svg/radio_button.svg"></div>
						<div class="icon checked" inlineSVG="assets/svg/radio_button_checked.svg"></div>
						Starter deck
					</label>

					<input
						*ngIf="expandedRunIds?.length === 1"
						type="radio"
						name="deck"
						id="final"
						value="final"
						[checked]="currentDeck === 'final'"
						(change)="changeCurrentDeck($event)"
					/>
					<label for="final" class="final">
						<div class="icon unchecked" inlineSVG="assets/svg/radio_button.svg"></div>
						<div class="icon checked" inlineSVG="assets/svg/radio_button_checked.svg"></div>
						Final deck
					</label>
				</div>
				<deck-list class="deck-list" [deckstring]="decklist"></deck-list>
			</div>
			<div class="stats" scrollable>
				<div class="header">All runs with "{{ deckName }}"</div>
				<duels-runs-list
					[state]="_state"
					[navigation]="_navigation"
					[deckstring]="deckDecklist"
					[displayLoot]="false"
				></duels-runs-list>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDeckDetailsComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationDuels) {
		this._navigation = value;
		this.updateValues();
	}

	deck: DuelsDeckSummary;
	deckDecklist: string;
	decklist: string;
	deckName: string;
	currentRun: DuelsRun;
	currentDeck: 'initial' | 'final';
	expandedRunIds: readonly string[];
	_state: DuelsState;
	_navigation: NavigationDuels;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	changeCurrentDeck(event) {
		if (this.currentDeck === 'initial') {
			this.currentDeck = 'final';
		} else {
			this.currentDeck = 'initial';
		}
		this.updateDecklist();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateDecklist() {
		switch (this.currentDeck) {
			case 'initial':
				this.decklist = this.deck.initialDeckList;
				console.debug('set decklist', this.decklist);
				return;
			case 'final':
				if (!this.currentRun) {
					this.decklist = null;
					return;
				}
				const runMatches: readonly GameStat[] = this.currentRun.steps
					.filter(step => (step as GameStat).playerDecklist)
					.map(step => step as GameStat);
				this.decklist = runMatches[runMatches.length - 1].playerDecklist;
				console.debug('set decklist', this.decklist);
				return;
		}
	}

	private updateValues() {
		if (!this._state?.playerStats?.deckStats || !this._navigation) {
			return;
		}

		this.deck = this._state.playerStats.personalDeckStats.find(
			deck => deck.initialDeckList === this._navigation.selectedPersonalDeckstring,
		);
		if (!this.deck) {
			return;
		}
		this.expandedRunIds = this._navigation.expandedRunIds;
		this.currentRun = this.expandedRunIds?.length === 1 ? this.deck.runs[0] : null;
		this.deckDecklist = this.deck.runs[0].initialDeckList;
		this.currentDeck = 'initial';
		this.updateDecklist();
		this.deckName = this.deck.deckName;
	}
}
