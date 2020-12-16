import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input } from '@angular/core';
import { DuelsDeckSummary } from '../../../models/duels/duels-personal-deck';
import { DuelsState } from '../../../models/duels/duels-state';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-personal-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/duels-personal-decks.component.scss`,
	],
	template: `
		<div *ngIf="_decks?.length" class="duels-decks">
			<ul class="deck-list">
				<li *ngFor="let deck of _decks">
					<duels-personal-deck-vignette [deck]="deck"></duels-personal-deck-vignette>
				</li>
			</ul>
		</div>
		<duels-empty-state *ngIf="!_decks?.length"></duels-empty-state>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDecksComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	_state: DuelsState;

	_decks: readonly DuelsDeckSummary[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private el: ElementRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		this._decks = this._state?.playerStats?.personalDeckStats ?? [];
	}
}
