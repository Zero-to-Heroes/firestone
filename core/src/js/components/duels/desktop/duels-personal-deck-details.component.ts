import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DuelsDeckSummary } from '../../../models/duels/duels-personal-deck';
import { DuelsState } from '../../../models/duels/duels-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { OwUtilsService } from '../../../services/plugins/ow-utils.service';

@Component({
	selector: 'duels-personal-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-personal-deck-details.component.scss`,
	],
	template: `
		<div class="duels-personal-deck-details" scrollable>
			<div class="deck-list-container starting">
				<copy-deckstring class="copy-deckcode" [deckstring]="decklist" title="Copy deck code">
				</copy-deckstring>
				<deck-list class="deck-list" [deckstring]="decklist"></deck-list>
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
	decklist: string;

	private _state: DuelsState;
	private _navigation: NavigationDuels;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly owUtils: OwUtilsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
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
		this.decklist = this.deck.initialDeckList;
	}
}
