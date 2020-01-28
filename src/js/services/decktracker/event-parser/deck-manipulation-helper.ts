import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';

@Injectable()
export class DeckManipulationHelper {
	constructor(private readonly allCards: AllCardsService) {}

	public removeSingleCardFromZone(
		zone: readonly DeckCard[],
		cardId: string,
		entityId: number,
		removeFillerCard: boolean = false,
	): readonly [readonly DeckCard[], DeckCard] {
		const debug = false; // entityId === 2098;
		// We have the entityId, so we just remove it
		if (zone.some(card => card.entityId === entityId)) {
			if (debug) {
				console.debug('removing', zone.find((card: DeckCard) => card.entityId === entityId));
			}
			return [
				zone.map((card: DeckCard) => (card.entityId === entityId ? null : card)).filter(card => card),
				zone.find((card: DeckCard) => card.entityId === entityId),
			];
		}
		if (!cardId) {
			// If there are some "fillter" cards (ie cards that exist only so that the deck has the right amount
			// of cards), we remove one
			if (zone.some(card => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId)) {
				let hasRemovedOnce = false;
				const result = [];
				let removedCard = undefined;
				if (debug) {
					console.debug(
						'removing filler card',
						zone,
						zone.filter(card => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId),
					);
				}
				for (const card of zone) {
					// We don't want to remove a card if it has a different entityId
					if (
						!card.entityId &&
						!card.cardId &&
						!card.cardName &&
						!card.creatorCardId &&
						!card.entityId &&
						!hasRemovedOnce
					) {
						hasRemovedOnce = true;
						removedCard = card;
						continue;
					}
					result.push(card);
				}
				return [result, removedCard];
			}
			// We don't have the entityId, and the cardId is not provided, so we return

			if (debug) {
				console.debug('returning initial zone', zone, cardId, entityId);
			}
			return [zone, null];
		}
		if (debug) {
			console.debug(
				'trying to remove a card from zone without using the entityId',
				cardId,
				entityId,
				zone.length,
				removeFillerCard,
			);
		}
		let hasRemovedOnce = false;
		let removedCard = null;
		const result = [];
		for (const card of zone) {
			// We don't want to remove a card if it has a different entityId
			if (card.cardId === cardId && !card.entityId && !hasRemovedOnce) {
				if (debug) {
					console.debug('removing card', card);
				}
				hasRemovedOnce = true;
				removedCard = card;
				continue;
			}
			result.push(card);
		}
		if (!removedCard && removeFillerCard) {
			if (debug) {
				console.debug(
					'could not find card to remove with entity and card ids, removing filler card?',
					zone.filter(card => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId),
				);
			}
			if (zone.some(card => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId)) {
				if (debug) {
					console.debug(
						'could not find card to remove with entity and card ids, removing filler card',
						zone.filter(card => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId),
					);
				}
				let hasRemovedOnce = false;
				const result = [];
				let removedCard = undefined;
				for (const card of zone) {
					// We don't want to remove a card if it has a different entityId
					if (
						!card.entityId &&
						!card.cardId &&
						!card.cardName &&
						!card.creatorCardId &&
						!card.entityId &&
						!hasRemovedOnce
					) {
						hasRemovedOnce = true;
						removedCard = card;
						continue;
					}
					result.push(card);
				}
				return [result, removedCard];
			}
			console.warn('could not find card to remove');
		}
		return [result, removedCard];
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
					// console.log('returning empty card');
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
			// console.log('trying to get a card without providing an entityId', cardId, zone);
			const found = zone.find(card => card.cardId === cardId);
			if (!found) {
				// console.log('could not find card, creating card with default template', cardId, entityId);
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
		// console.log('card in hand', cardInHand);
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

	// We can't always make a connection between the card in hand and the card that started in the deck
	// when we are facing an opponent with a known decklist (like is the case with the AI for instance)
	// There are some cases where we know that a card in hand is a specific card coming from the deck:
	// if has been bounced back from the board for instance (then it has a card id).
	// If the card has a creatorCardId, we know that it's not from the original deck, so we do nothing
	public updateDeckForAi(gameEvent: GameEvent, currentState: GameState, removedCard: DeckCard) {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		if (!isPlayer && currentState.opponentDeck.deckList && !removedCard.creatorCardId && !removedCard.cardId) {
			const newCardId = this.overrideCardIdForSomeAiCards(cardId);
			const result = this.removeSingleCardFromZone(deck.deck, newCardId, entityId);
			return result[0];
		}
		return deck.deck;
	}

	// The spellstones are present in the AI decklist in their basic version
	// However, if the AI plays the spellstone's upgraded version, we need to remove
	// the basic one from the decklist
	private overrideCardIdForSomeAiCards(cardId: string): string {
		switch (cardId) {
			// The spellstones
			case 'LOOT_103t1':
			case 'LOOT_103t2':
				return 'LOOT_103';
			case 'LOOT_043t2':
			case 'LOOT_043t3':
				return 'LOOT_043';
			case 'LOOT_051t1':
			case 'LOOT_051t2':
				return 'LOOT_051';
			case 'LOOT_064t1':
			case 'LOOT_064t2':
				return 'LOOT_064';
			case 'LOOT_080t2':
			case 'LOOT_080t3':
				return 'LOOT_080';
			case 'LOOT_091t1':
			case 'LOOT_091t2':
				return 'LOOT_091';
			case 'LOOT_203t2':
			case 'LOOT_203t3':
				return 'LOOT_203';
			case 'LOOT_503t':
			case 'LOOT_503t2':
				return 'LOOT_503';
			case 'LOOT_507t':
			case 'LOOT_507t2':
				return 'LOOT_507';
			case 'FB_Champs_LOOT_080t2':
			case 'FB_Champs_LOOT_080t3':
				return 'FB_Champs_LOOT_080';
			default:
				return cardId;
		}
	}
}
