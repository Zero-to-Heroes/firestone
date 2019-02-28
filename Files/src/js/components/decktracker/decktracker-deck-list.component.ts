import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckState } from '../../models/decktracker/deck-state';

declare var overwolf: any;

@Component({
	selector: 'decktracker-deck-list',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker-deck-list.component.scss',
	],
	template: `
		<div class="deck-list">
			<ng-container [ngSwitch]="_displayMode">
				<deck-list-by-zone 
					*ngSwitchCase="'DISPLAY_MODE_ZONE'" 
					[deckState]="_deckState">
				</deck-list-by-zone>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckListComponent {

	_deckState: DeckState;
	_displayMode: string = 'DISPLAY_MODE_ZONE';

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
	}

}