import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckState } from '../../models/decktracker/deck-state';
import { DeckZone } from '../../models/decktracker/view/deck-zone';
import { DeckCard } from '../../models/decktracker/deck-card';

declare var overwolf: any;

@Component({
	selector: 'deck-list-by-zone',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/deck-list-by-zone.component.scss',
	],
	template: `
		<ul class="deck-list">
			<li *ngFor="let zone of zones">
				<deck-zone [zone]="zone"></deck-zone>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListByZoneComponent {

	zones: ReadonlyArray<DeckZone>;

	@Input('deckState') set deckState(deckState: DeckState) {
		this.zones = [
			this.buildZone(deckState.deck, 'In deck'),
			this.buildZone(deckState.graveyard, 'Graveyard'),
			this.buildZone(deckState.hand, 'In your hand'),
			this.buildZone(deckState.otherZone, 'Other'),
		]
	}

	private buildZone(cards: ReadonlyArray<DeckCard>, name: string): DeckZone {
		return {
			name: name,
			cards: cards,
		} as DeckZone;
	}
}