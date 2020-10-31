import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsState } from '../../../models/duels/duels-state';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-top-decks',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-top-decks.component.scss`,
	],
	template: `
		<div class="duels-top-decks" scrollable>
			<duels-grouped-top-decks *ngFor="let stat of groupedDecks" [groupedDecks]="stat"></duels-grouped-top-decks>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO: infinite scroll
export class DuelsTopDecksComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	_state: DuelsState;
	groupedDecks: readonly DuelsGroupedDecks[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state?.playerStats) {
			return;
		}

		this.groupedDecks = this._state.playerStats.deckStats;
		// switch (this._state.activeTreasureStatTypeFilter) {
		// 	case 'treasure':
		// 		this.stats = this._state.playerStats.treasureStats.filter(
		// 			stat => !isPassive(stat.cardId, this.allCards),
		// 		);
		// 		break;
		// 	case 'passive':
		// 		this.stats = this._state.playerStats.treasureStats.filter(stat =>
		// 			isPassive(stat.cardId, this.allCards),
		// 		);
		// 		break;
		// }
	}
}
