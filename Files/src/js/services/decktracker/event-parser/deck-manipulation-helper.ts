import { DeckCard } from '../../../models/decktracker/deck-card';

export class DeckManipulationHelper {
	public static removeSingleCardFromZone(zone: readonly DeckCard[], cardId: string, entityId: number): readonly DeckCard[] {
		// We have the entityId, so we just remove it
		if (zone.some(card => card.entityId === entityId)) {
			return zone.map((card: DeckCard) => (card.entityId === entityId ? null : card)).filter(card => card);
		}
		// We don't have the entityId, and the cardId is not provided, so we return
		if (!cardId) {
			return zone;
		}
		console.debug('removing a card from zone without using the entityId', cardId, entityId, zone);
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
		// Explicit search by entity id
		if (entityId) {
			const found = zone.find(card => card.entityId === entityId);
			if (!found) {
				// Card hasn't been found, so we provide a default return
				if (cardId) {
					const idByCardId = zone.find(card => card.cardId === cardId && !card.entityId);
					return Object.assign(new DeckCard(), idByCardId, {
						entityId: entityId,
						cardId: cardId,
					} as DeckCard);
				} else if (cardId == null) {
					// We explicitely said we wanted a card identified by an entityId, so we don't fallback
					// It's important to distinguish between "force en entityId recognition" and "I didn't have
					// the cardID to identify the card" (like when dealing with the opponent's deck).
					// The second case is handled by passing an empty cardId (which is what is returned by the
					// parser plugin)
					return null;
				} else {
					// Empty card Id
					return Object.assign(new DeckCard(), {
						entityId: entityId,
					} as DeckCard);
				}
			}
			// Fill the card ID typically when an opponent plays a card from their hand
			// We always override with the ID in input, as it's guaranteed to be accurate (for
			// instance if the card changed in hand and our info is outdated)
			if (cardId) {
				return Object.assign(new DeckCard(), found, {
					cardId: cardId,
				} as DeckCard);
			}
			return found;
		}
		// Search by cardId only
		if (cardId) {
			console.error('trying to get a card without providing an entityId', cardId, zone);
			const found = zone.find(card => card.cardId === cardId);
			if (!found) {
				console.log('could not find card, creating card with default template', cardId, entityId);
				return Object.assign(new DeckCard(), {
					cardId: cardId,
					entityId: entityId,
				} as DeckCard);
			}
			return found;
		}
		console.error('invalid call to findCard', entityId, cardId);
		return new DeckCard();

		// if (!found) {
		// 	console.error('Could not find card in zone', cardId, entityId, zone);
		// 	found = zone.find(card => !card.cardId);
		// 	console.log('defaulting to getting a card without cardId', found);
		// }
		// if (!found) {
		// 	found = Object.assign(new DeckCard(), {
		// 		cardId: cardId,
		// 		entityId: entityId,
		// 	} as DeckCard);
		// 	console.log('could not find card, creating card with default template', found);
		// }
		// return found;
	}

	public static obfuscateCard(card: DeckCard): DeckCard {
		return Object.assign(new DeckCard(), card, {
			cardId: undefined,
		} as DeckCard);
	}
}
