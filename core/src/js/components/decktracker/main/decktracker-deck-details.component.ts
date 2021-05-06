import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../models/preferences';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { OwUtilsService } from '../../../services/plugins/ow-utils.service';

@Component({
	selector: 'decktracker-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-details.component.scss`,
	],
	template: `
		<div class="decktracker-deck-details">
			<div class="deck-list-container">
				<copy-deckstring class="copy-deckcode" [deckstring]="deck?.deckstring" copyText="Copy deck code">
				</copy-deckstring>
				<deck-list class="deck-list" [deckstring]="deck?.deckstring"></deck-list>
			</div>
			<deck-winrate-matrix [deck]="deck" [showMatchupAsPercentagesValue]="showMatchupAsPercentages">
			</deck-winrate-matrix>
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

	@Input() set prefs(value: Preferences) {
		this.showMatchupAsPercentages = value?.desktopDeckShowMatchupAsPercentages ?? true;
		this.updateValues();
	}

	showMatchupAsPercentages = true;
	deck: DeckSummary;

	private _state: MainWindowState;
	private _navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly owUtils: OwUtilsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state?.decktracker?.decks || !this._navigation?.navigationDecktracker) {
			return;
		}

		this.deck = this._state.decktracker.decks.find(
			(deck) => deck.deckstring === this._navigation.navigationDecktracker.selectedDeckstring,
		);
		// console.debug('updating deck', this.deck);
	}
}
