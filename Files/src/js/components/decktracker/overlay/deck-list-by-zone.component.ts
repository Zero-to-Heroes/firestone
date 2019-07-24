import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DynamicZone } from '../../../models/decktracker/view/dynamic-zone';

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
		const zones = [
			this.buildZone(deckState.deck, 'deck', 'In your deck', (a, b) => a.manaCost - b.manaCost),
			this.buildZone(deckState.hand, 'hand', 'In your hand', (a, b) => a.manaCost - b.manaCost),
        ];
        // If there are no dynamic zones, we use the standard "other" zone
        if (deckState.dynamicZones.length === 0) {
			const otherZone = [...deckState.otherZone, ...deckState.board];
            zones.push(this.buildZone(otherZone, 'other', 'Other', (a, b) => a.manaCost - b.manaCost));
        }
        // Otherwise, we add all the dynamic zones
        deckState.dynamicZones.forEach((zone) => {
            zones.push(this.buildDynamicZone(zone, (a, b) => a.manaCost - b.manaCost));
        })
        this.zones = zones as ReadonlyArray<DeckZone>;
	}

	trackZone(index, zone: DeckZone) {
		return zone.id;
    }
    
    private buildDynamicZone(
            zone: DynamicZone, 
            sortingFunction: (a: DeckCard, b: DeckCard) => number): DeckZone {
        return {
			id: zone.id,
			name: zone.name,
			cards: zone.cards,
			sortingFunction: sortingFunction,
		} as DeckZone;
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