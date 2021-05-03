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
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { SetCard } from '../../../models/set';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-personal-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-personal-deck-details.component.scss`,
	],
	template: `
		<div class="duels-personal-deck-details" [ngClass]="{ 'top-deck': !isPersonalDeck }">
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
						type="radio"
						name="deck"
						id="final"
						value="final"
						[checked]="currentDeck === 'final'"
						(change)="changeCurrentDeck($event)"
						[disabled]="expandedRunIds?.length !== 1"
					/>
					<label
						for="final"
						class="final"
						[ngClass]="{ 'disabled': expandedRunIds?.length !== 1 }"
						[helpTooltip]="helpTooltip"
					>
						<div class="icon unchecked" inlineSVG="assets/svg/radio_button.svg"></div>
						<div class="icon checked" inlineSVG="assets/svg/radio_button_checked.svg"></div>
						Final deck
					</label>
				</div>
				<deck-list class="deck-list" [deckstring]="decklist" [collection]="getCollection()"></deck-list>
			</div>
			<div class="stats" scrollable *ngIf="isPersonalDeck">
				<div class="header">All runs with "{{ deckName }}"</div>
				<duels-runs-list
					[state]="_state.duels"
					[navigation]="_navigation"
					[deckstring]="deckDecklist"
					[displayLoot]="false"
				></duels-runs-list>
			</div>
			<div class="stats" scrollable *ngIf="!isPersonalDeck">
				<div class="header">Run details</div>
				<duels-run [run]="run" [displayLoot]="true" [isExpanded]="true"></duels-run>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDeckDetailsComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
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
	helpTooltip: string;
	collection: readonly SetCard[];

	isPersonalDeck = true;
	run: DuelsRun;

	_state: MainWindowState;
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

	getCollection(): readonly SetCard[] {
		const result = this.currentDeck === 'final' ? null : this.collection;
		return result;
	}

	private updateDecklist() {
		switch (this.currentDeck) {
			case 'initial':
				this.decklist = this.deck.initialDeckList;
				return;
			case 'final':
				if (!this.currentRun) {
					this.decklist = null;
					return;
				}
				const runMatches: readonly GameStat[] = (this.currentRun.steps ?? [])
					.filter(step => (step as GameStat).playerDecklist)
					.map(step => step as GameStat);
				this.decklist = runMatches.length > 0 ? runMatches[runMatches.length - 1].playerDecklist : null;
				return;
		}
	}

	private updateValues() {
		if (!this._state?.duels?.playerStats?.personalDeckStats || !this._navigation) {
			return;
		}

		this.deck = this.getDeck();
		if (!this.deck) {
			return;
		}

		this.deckDecklist = this.deck.initialDeckList || this.deck.runs[0].initialDeckList;
		this.currentDeck = 'initial';
		this.deckName = this.deck.deckName;
		this.collection = this._state.binder.allSets.map(set => set.allCards).reduce((a, b) => a.concat(b), []);

		this.expandedRunIds = this._navigation.expandedRunIds;
		this.currentRun = this.expandedRunIds?.length >= 1 ? this.deck.runs[0] : null;
		this.helpTooltip =
			this.expandedRunIds?.length === 1
				? null
				: 'Please expand a single run on the right column to view its final decklist';
		this.updateDecklist();
	}

	private getDeck(): DuelsDeckSummary {
		if (this._navigation.selectedPersonalDeckstring) {
			this.isPersonalDeck = true;
			this.run = null;
			return this._state.duels.playerStats.personalDeckStats.find(
				deck => deck.initialDeckList === this._navigation.selectedPersonalDeckstring,
			);
		}
		if (this._navigation.selectedDeckId) {
			const deckStat = this._state.duels.playerStats.deckStats
				.map(grouped => grouped.decks)
				.reduce((a, b) => a.concat(b), [])
				.find(deck => deck?.id === this._navigation.selectedDeckId);
			if (!deckStat) {
				console.error('[duels-personal-deck-details] could not find deckstat', this._navigation.selectedDeckId);
				return null;
			}
			const additionalStat = (this._state.duels.additionalDeckDetails ?? []).find(
				stat => stat.id === deckStat.id,
			);
			this.isPersonalDeck = false;
			this.run = {
				creationTimestamp: undefined,
				id: deckStat.runId,
				ratingAtEnd: undefined,
				ratingAtStart: undefined,
				rewards: undefined,
				heroCardId: deckStat.heroCardId,
				heroPowerCardId: deckStat.heroPowerCardId,
				initialDeckList: deckStat.decklist,
				losses: deckStat.losses,
				signatureTreasureCardId: deckStat.signatureTreasureCardId,
				type: deckStat.gameMode,
				wins: deckStat.wins,
				steps: deckStat.steps ?? additionalStat?.steps,
			};
			const runs: readonly DuelsRun[] = [this.run];
			return {
				deckName: 'tmp',
				initialDeckList: deckStat.decklist,
				runs: runs,
				heroCardId: deckStat.heroCardId,
				playerClass: deckStat.playerClass,
			} as DuelsDeckSummary;
		}
		return null;
	}
}
