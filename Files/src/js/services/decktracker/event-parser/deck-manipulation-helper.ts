import { DeckCard } from '../../../models/decktracker/deck-card';

export class DeckManipulationHelper {
	public static removeSingleCardFromZone(zone: readonly DeckCard[], cardId: string, entityId: number): readonly DeckCard[] {
		// We have the entityId, so we just remove it
		if (zone.some(card => card.entityId === entityId)) {
			return zone.map((card: DeckCard) => (card.entityId === entityId ? null : card)).filter(card => card);
		}
		console.warn('removing a card from zone without using the entityId', cardId, entityId, zone);
		let hasRemovedOnce = false;
		const result = [];
		for (const card of zone) {
			// We don't want to remove a card if it has a different entityId
			if (card.cardId === cardId && !card.entityId && !hasRemovedOnce) {
				hasRemovedOnce = true;
				continue;
			}
			result.push(card);
		}
		return result;
	}

	public static addSingleCardToZone(zone: readonly DeckCard[], cardTemplate: DeckCard): readonly DeckCard[] {
		const newCard = Object.assign(new DeckCard(), {
			cardId: cardTemplate.cardId,
			entityId: cardTemplate.entityId,
			cardName: cardTemplate.cardName,
			manaCost: cardTemplate.manaCost,
			rarity: cardTemplate.rarity,
			zone: cardTemplate.zone,
		} as DeckCard);
		return [...zone, newCard];
	}

	public static findCardInZone(zone: readonly DeckCard[], cardId: string, entityId: number): DeckCard {
		let found;
		if (!entityId) {
			console.error('trying to get a card without providing an entityId', cardId, zone);
			found = zone.find(card => card.cardId === cardId);
		} else {
			found = zone.find(card => card.entityId === entityId);
			if (!found) {
				found = zone.find(card => card.cardId === cardId && !card.entityId);
				found = Object.assign(new DeckCard(), found, {
					entityId: entityId,
					cardId: cardId,
				} as DeckCard);
			}
		}
		if (!found) {
			console.error('Could not find card in zone', cardId, zone);
			found = zone.find(card => !card.cardId);
			console.log('defaulting to getting a card without cardId', found);
		}
		if (!found) {
			found = Object.assign(new DeckCard(), {
				cardId: cardId,
				entityId: entityId,
			} as DeckCard);
			console.log('could not find card, creating card with default template', found);
		}
		return found;
	}
}
