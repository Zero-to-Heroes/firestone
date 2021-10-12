import { Injectable } from '@angular/core';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';
import { DynamicZone } from '../../models/decktracker/view/dynamic-zone';
import { DeckManipulationHelper } from './event-parser/deck-manipulation-helper';

@Injectable()
export class DynamicZoneHelperService {
	constructor(private readonly helper: DeckManipulationHelper) {}

	public fillDynamicZones(deckState: DeckState): DeckState {
		const dynamicZones: DynamicZone[] = [];

		// For now ony handle Discard zone
		const alwaysShowDiscard = false;
		const dynamicallyShowDiscard = false;
		const shouldDeckTriggerDiscard = false;
		if (alwaysShowDiscard || (dynamicallyShowDiscard && shouldDeckTriggerDiscard)) {
			const newDiscardZone = this.buildDiscardZone(deckState);
			dynamicZones.push(newDiscardZone);
		}

		// In case some dynamic zones are used, we need to build a dynamic "other" zone that
		// will include all the cards not in the other dynamic zones
		if (dynamicZones.length > 0) {
			const cardsNotInOtherZone = dynamicZones.map((zone) => zone.cards).reduce((a, b) => a.concat(b), []);
			let newOtherZoneCards = [...deckState.otherZone];
			for (const card of cardsNotInOtherZone) {
				newOtherZoneCards = [
					...this.helper.removeSingleCardFromZone(newOtherZoneCards, card.cardId, card.entityId)[0],
				];
			}
			dynamicZones.push(
				Object.assign(new DynamicZone(), {
					id: 'other-zone',
					name: 'Other',
					cards: newOtherZoneCards as readonly DeckCard[],
				} as DynamicZone),
			);
		}
		return Object.assign(new DeckState(), deckState, {
			dynamicZones: dynamicZones as readonly DynamicZone[],
		} as DeckState);
	}

	private buildDiscardZone(deckState: DeckState): DynamicZone {
		const discardedCards = deckState.otherZone.filter((card) => card.zone === 'DISCARD');
		return Object.assign(new DynamicZone(), {
			id: 'discard-zone',
			name: 'Discard',
			cards: discardedCards,
		} as DynamicZone);
	}
}
