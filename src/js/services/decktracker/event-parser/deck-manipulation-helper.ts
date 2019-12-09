import { Injectable } from '@angular/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { AllCardsService } from '../../all-cards.service';

@Injectable()
export class DeckManipulationHelper {
	constructor(private readonly allCards: AllCardsService) {}

	public removeSingleCardFromZone(zone: readonly DeckCard[], cardId: string, entityId: number): readonly DeckCard[] {
		// We have the entityId, so we just remove it
		if (zone.some(card => card.entityId === entityId)) {
			return zone.map((card: DeckCard) => (card.entityId === entityId ? null : card)).filter(card => card);
		}
		// We don't have the entityId, and the cardId is not provided, so we return
		if (!cardId) {
			return zone;
		}
		// console.log('removing a card from zone without using the entityId', cardId, entityId, zone.length);
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

	public addSingleCardToZone(zone: readonly DeckCard[], cardTemplate: DeckCard, debug = false): readonly DeckCard[] {
		// Safeguard to not add twice the same card to the zone
		// This is useful in case of cards stolen, where the power.log moves the card to SETASIDE, then changes the controller
		// (triggering the "card stolen" event), then changes the zone (triggering the "receive card in hand" event)
		if (zone.filter(card => card.entityId === cardTemplate.entityId).length > 0) {
			if (debug) {
				console.debug('card already added to zone', zone, cardTemplate);
			}
			return zone;
		}
		const newCard = DeckCard.create({
			cardId: cardTemplate.cardId,
			entityId: cardTemplate.entityId,
			cardName: cardTemplate.cardName,
			manaCost: cardTemplate.manaCost,
			rarity: cardTemplate.rarity,
			zone: cardTemplate.zone,
			creatorCardId: cardTemplate.creatorCardId,
		} as DeckCard);
		if (debug) {
			console.debug('adding card to zone', [...zone, newCard]);
		}
		return [...zone, newCard];
	}

	public findCardInZone(zone: readonly DeckCard[], cardId: string, entityId: number): DeckCard {
		// Explicit search by entity id
		if (entityId) {
			const found = zone.find(card => card.entityId === entityId);
			if (!found) {
				// Card hasn't been found, so we provide a default return
				if (cardId) {
					const idByCardId = zone.find(card => card.cardId === cardId && !card.entityId);
					if (idByCardId) {
						const card = this.allCards.getCard(cardId);
						return idByCardId.update({
							entityId: entityId,
							cardId: cardId,
							cardName: card && card.name,
						} as DeckCard);
					} else {
						console.warn('could not find card in zone', cardId, entityId, zone.map(card => card.entityId));
					}
				} else if (cardId == null) {
					// We explicitely said we wanted a card identified by an entityId, so we don't fallback
					// It's important to distinguish between "force en entityId recognition" and "I didn't have
					// the cardID to identify the card" (like when dealing with the opponent's deck).
					// The second case is handled by passing an empty cardId (which is what is returned by the
					// parser plugin)
					// console.log('returning null because no card id');
					return null;
				} else {
					// Empty card Id
					return DeckCard.create({
						entityId: entityId,
					} as DeckCard);
				}
			}
			// Fill the card ID typically when an opponent plays a card from their hand
			// We always override with the ID in input, as it's guaranteed to be accurate (for
			// instance if the card changed in hand and our info is outdated)
			if (found && cardId) {
				const card = this.allCards.getCard(cardId);
				return found.update({
					cardId: cardId,
					cardName: (card && card.name) || found.cardName,
				} as DeckCard);
			}
			if (found) {
				return found;
			}
		}
		// Search by cardId only
		if (cardId) {
			console.log('trying to get a card without providing an entityId', cardId, zone);
			const found = zone.find(card => card.cardId === cardId);
			if (!found) {
				console.log('could not find card, creating card with default template', cardId, entityId);
				const card = this.allCards.getCard(cardId);
				return DeckCard.create({
					cardId: cardId,
					cardName: card ? card.name : null,
					entityId: entityId,
				} as DeckCard);
			}
			return found;
		}
		console.error('invalid call to findCard', entityId, cardId);
		return DeckCard.create();
	}

	public obfuscateCard(card: DeckCard): DeckCard {
		// console.log('ofuscating card', card);
		return card.update({
			cardId: undefined,
			creatorCardId: undefined,
		} as DeckCard);
	}

	public assignCardIdToEntity(deck: DeckState, entityId: number, cardId: string): DeckState {
		const cardInHand = this.findCardInZone(deck.hand, null, entityId);
		console.log('card in hand', cardInHand);
		if (cardInHand && !cardInHand.cardId) {
			const newCard = cardInHand.update({
				cardId: cardId,
			} as DeckCard);
			const newHand = this.replaceCardInZone(deck.hand, newCard);
			return Object.assign(new DeckState(), deck, {
				hand: newHand,
			} as DeckState);
		}
		return deck;
	}

	public replaceCardInZone(zone: readonly DeckCard[], newCard: DeckCard): readonly DeckCard[] {
		const zoneWithoutCard = zone.filter(card => card.entityId !== newCard.entityId);
		// console.debug('zone without card', zone);
		return [...zoneWithoutCard, newCard];
	}
}
