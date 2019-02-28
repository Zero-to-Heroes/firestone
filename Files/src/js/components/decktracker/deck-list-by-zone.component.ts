import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckState } from '../../models/decktracker/deck-state';

declare var overwolf: any;

@Component({
	selector: 'deck-list-by-zone',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/deck-list-by-zone.component.scss',
	],
	template: `
		<div class="deck-list">
		
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListByManaComponent {

	allCards: ReadonlyArray<VisualDeckCard>;

	@Input('deckState') set deckState(deckState: DeckState) {
		// this._deckState = deckState;
	}
}

export interface VisualDeckCard {
	readonly cardId: string;
	readonly name: string;
	readonly zone: string;
    readonly manaCost: number;
	readonly quantity: number;
}