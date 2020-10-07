import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { DeckHandlerService } from '../../../services/decktracker/deck-handler.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-details.component.scss`,
	],
	template: `
		<div class="decktracker-deck-details">
			<decktracker-deck-list
				class="deck-list"
				[deckState]="deckState"
				displayMode="DISPLAY_MODE_GROUPED"
				[colorManaCost]="true"
				tooltipPosition="right"
			></decktracker-deck-list>
			<deck-winrate-matrix [deck]="deck"> </deck-winrate-matrix>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckDetailsComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.updateValues();
	}

	deck: DeckSummary;
	deckState: DeckState;

	private _state: MainWindowState;
	private _navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly deckHandler: DeckHandlerService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state?.decktracker?.decks || !this._navigation?.navigationDecktracker) {
			return;
		}

		this.deck = this._state.decktracker.decks.find(
			deck => deck.deckstring === this._navigation.navigationDecktracker.selectedDeckstring,
		);
		if (!this.deck) {
			return;
		}

		const decklist = this.deckHandler.buildDeckList(this.deck.deckstring);

		this.deckState = DeckState.create({
			deckList: decklist,
		} as DeckState);
	}
}
