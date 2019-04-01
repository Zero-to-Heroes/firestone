import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { DeckCard } from '../../../models/decktracker/deck-card';

declare var overwolf: any;

@Component({
	selector: 'deck-list-by-zone',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/deck-list-by-zone.component.scss',
	],
	template: `
		<ul class="deck-list">
			<li *ngFor="let zone of zones; trackBy: trackZone">
				<deck-zone [zone]="zone" [activeTooltip]="activeTooltip"></deck-zone>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListByZoneComponent {

	@Input() activeTooltip: string;
	zones: ReadonlyArray<DeckZone>;

	@Input('deckState') set deckState(deckState: DeckState) {
		this.zones = [
			this.buildZone(deckState.deck, 'deck', 'In deck', (a, b) => a.manaCost - b.manaCost),
			// this.buildZone(deckState.graveyard, 'Graveyard'),
			this.buildZone(deckState.hand, 'hand', 'In your hand', (a, b) => a.manaCost - b.manaCost),
			this.buildZone(deckState.otherZone, 'other', 'Other', (a, b) => a.manaCost - b.manaCost),
		]
	}

	trackZone(index, zone: DeckZone) {
		return zone.id;
	}

	private buildZone(
			cards: ReadonlyArray<DeckCard>, 
			id: string, 
			name: string, 
			sortingFunction: (a: DeckCard, b: DeckCard) => number): DeckZone {
		return {
			id: id,
			name: name,
			cards: cards,
			sortingFunction: sortingFunction,
		} as DeckZone;
	}
}