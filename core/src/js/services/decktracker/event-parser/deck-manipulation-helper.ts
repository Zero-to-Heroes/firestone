import { Injectable } from '@angular/core';
import { getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BoardSecret } from '../../../models/decktracker/board-secret';
import { CardMetaInfo } from '../../../models/decktracker/card-meta-info';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { SecretOption } from '../../../models/decktracker/secret-option';
import { EntityGameState, GameEvent, GameState as EventGameState, PlayerGameState } from '../../../models/game-event';

@Injectable()
export class DeckManipulationHelper {
	constructor(private readonly allCards: CardsFacadeService) {}

	public removeSingleCardFromZone(
		zone: readonly DeckCard[],
		cardId: string,
		entityId: number,
		removeFillerCard = false,
		normalizeUpgradedCards = false,
		debug = false,
	): readonly [readonly DeckCard[], DeckCard] {
		const normalizedCardId = this.normalizeCardId(cardId, normalizeUpgradedCards);
		if (debug) {
			console.debug(
				'removing',
				cardId,
				normalizedCardId,
				entityId,
				removeFillerCard,
				normalizeUpgradedCards,
				zone,
			);
		}

		// We have the entityId, so we just remove it
		if (zone.some((card) => card.entityId === entityId)) {
			if (debug) {
				console.debug(
					'removing',
					zone.find((card: DeckCard) => card.entityId === entityId),
				);
			}
			return [
				zone.map((card: DeckCard) => (card.entityId === entityId ? null : card)).filter((card) => card),
				zone.find((card: DeckCard) => card.entityId === entityId),
			];
		}

		if (!normalizedCardId) {
			// If there are some "filler" cards (ie cards that exist only so that the deck has the right amount
			// of cards), we remove one
			if (zone.some((card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId)) {
				let hasRemovedOnce = false;
				const result = [];
				let removedCard = undefined;
				if (debug) {
					console.debug(
						'removing filler card',
						zone,
						zone.filter((card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId),
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
				normalizedCardId,
				entityId,
				zone.length,
				removeFillerCard,
			);
		}
		// Remove using the card id
		let hasRemovedOnce = false;
		let removedCard = null;
		const result = [];
		// By default, we don't want to remove a card with a known entity ID, as the entityId is some useful info
		// on the card. We only do so if a) we find a card that matches our input card id and b) all such cards
		// have a valid entityId (typically the case with Soul Fragments)
		const shouldIgnoreEntityId =
			zone.some((card) => this.normalizeCardId(card.cardId, normalizeUpgradedCards) === normalizedCardId) &&
			zone
				.filter((card) => this.normalizeCardId(card.cardId, normalizeUpgradedCards) === normalizedCardId)
				.every((card) => card.entityId);
		for (const card of zone) {
			// console.log('considering', normalizedCardId, card.cardId, card);
			// We don't want to remove a card if it has a different entityId
			const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
			// Here we don't want to remove a card with a known entity id, as it might conflict
			// with another
			if (refCardId === normalizedCardId && (shouldIgnoreEntityId || !card.entityId) && !hasRemovedOnce) {
				if (debug) {
					console.debug('removing card', card);
				}
				hasRemovedOnce = true;
				removedCard = card;
				continue;
			}
			result.push(card);
		}

		if (debug) {
			console.debug('found card to remove?', removedCard, result);
		}

		if (!removedCard) {
			// First remove cards that are not exactly fillers, but unknown cards that we can match based
			// on some characteristic of the card
			const drawnCard = normalizedCardId ? this.allCards.getCard(normalizedCardId) : null;
			if (debug) {
				console.debug('trying to remove special cards', drawnCard, normalizedCardId);
			}
			if (drawnCard) {
				const candidates = zone
					.filter((card) => card.cardMatchCondition)
					.filter((card) => card.cardMatchCondition(drawnCard));
				if (debug) {
					console.debug('found candidates to remove', candidates);
				}

				if (candidates?.length) {
					let hasRemovedOnce = false;
					const result = zone.filter(
						(card) => !card.cardMatchCondition || !card.cardMatchCondition(drawnCard),
					);
					let removedCard = undefined;
					for (const card of candidates) {
						// We don't want to remove a card if it has a different entityId
						if (!hasRemovedOnce) {
							hasRemovedOnce = true;
							removedCard = card;
							continue;
						}
						result.push(card);
					}
					if (debug) {
						console.debug('returning', result, removedCard);
					}
					return [result, removedCard];
				}
			}
		}

		if (!removedCard && removeFillerCard) {
			if (zone.some((card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId)) {
				if (debug) {
					console.debug(
						'could not find card to remove with entity and card ids, removing filler card',
						zone.filter((card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId),
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

	// When the buffs are sent alongside teh receive_card_in_hand event, we keep them
	public addSingleCardToZone(
		zone: readonly DeckCard[],
		cardTemplate: DeckCard,
		keepBuffs = false,
		debug = false,
	): readonly DeckCard[] {
		// Safeguard to not add twice the same card to the zone
		// This is useful in case of cards stolen, where the power.log moves the card to SETASIDE, then changes the controller
		// (triggering the "card stolen" event), then changes the zone (triggering the "receive card in hand" event)
		if (
			cardTemplate.entityId != null &&
			zone.filter((card) => card.entityId === cardTemplate.entityId).length > 0
		) {
			// console.debug(
			// 	'card already added to zone',
			// 	zone,
			// 	cardTemplate,
			// 	zone.filter(card => card.entityId === cardTemplate.entityId),
			// );
			return zone;
		}
		const newCard = DeckCard.create({
			...cardTemplate,
			buffingEntityCardIds: keepBuffs ? cardTemplate.buffingEntityCardIds : undefined,
			buffCardIds: keepBuffs ? cardTemplate.buffCardIds : undefined,
			metaInfo: new CardMetaInfo(),
		} as DeckCard);
		// console.debug('adding card to zone', [...zone, newCard], cardTemplate);
		return [...zone, newCard];
	}

	public updateCardInDeck(deck: DeckState, card: DeckCard): DeckState {
		if (!card?.entityId) {
			console.warn('missing entityId for card update', card);
			return deck;
		}

		return deck.update({
			hand: this.updateCardInZone(deck.hand, card.entityId, card.cardId),
			board: this.updateCardInZone(deck.board, card.entityId, card.cardId),
			deck: this.updateCardInZone(deck.deck, card.entityId, card.cardId),
			otherZone: this.updateCardInZone(deck.otherZone, card.entityId, card.cardId),
		} as DeckState);
	}

	public updateCardInZone(zone: readonly DeckCard[], entityId: number, cardId: string): readonly DeckCard[] {
		if (!cardId) {
			return zone;
		}
		return zone.map((card) =>
			card.entityId !== entityId
				? card
				: card.update({
						cardId: cardId,
						cardName: this.allCards.getCard(cardId)?.name,
				  } as DeckCard),
		);
	}

	public findCardInZone(
		zone: readonly DeckCard[],
		cardId: string,
		entityId: number,
		normalizeUpgradedCards = false,
	): DeckCard {
		const normalizedCardId = this.normalizeCardId(cardId, normalizeUpgradedCards);
		// Explicit search by entity id
		if (entityId) {
			const found = zone.find((card) => card.entityId === entityId);
			if (!found) {
				// Card hasn't been found, so we provide a default return
				if (cardId) {
					const idByCardId = zone.find((card) => {
						const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
						return refCardId === normalizedCardId && !card.entityId;
					});
					if (idByCardId) {
						const card = this.allCards.getCard(normalizedCardId);
						return idByCardId.update({
							entityId: entityId,
							cardId: cardId,
							cardName: card && card.name,
						} as DeckCard);
					} else {
						// console.warn(
						// 	'could not find card in zone',
						// 	cardId,
						// 	entityId,
						// 	zone.map(card => card.entityId),
						// 	zone.map(card => card.cardId),
						// );
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
			const found = zone.find((card) => {
				const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
				return refCardId === normalizedCardId && !card.entityId;
			});
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

	// public obfuscateCard(card: DeckCard): DeckCard {
	// 	// console.log('ofuscating card', card);
	// 	return card.update({
	// 		// entityId: undefined,
	// 		cardId: undefined,
	// 		creatorCardId: undefined,
	// 	} as DeckCard);
	// }

	public assignCardIdToEntity(deck: DeckState, entityId: number, cardId: string): DeckState {
		const cardInHand = this.findCardInZone(deck.hand, null, entityId);
		// console.log('card in hand', cardInHand);
		if (cardInHand && !cardInHand.cardId) {
			const newCard = cardInHand.update({
				cardId: cardId,
				cardName: this.allCards.getCard(cardId)?.name,
			} as DeckCard);
			const newHand = this.replaceCardInZone(deck.hand, newCard);
			return Object.assign(new DeckState(), deck, {
				hand: newHand,
			} as DeckState);
		}
		return deck;
	}

	public replaceCardInZone(zone: readonly DeckCard[], newCard: DeckCard): readonly DeckCard[] {
		const cardIndex = zone.map((card) => card.entityId).indexOf(newCard.entityId);
		const newZone = [...zone];
		newZone[cardIndex] = newCard;
		return newZone;
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
			const newCardId = getBaseCardId(cardId);
			const result = this.removeSingleCardFromZone(deck.deck, newCardId, entityId);
			return result[0];
		}
		return deck.deck;
	}

	public removeSecretOption(deck: DeckState, secretCardId: string): DeckState {
		return deck.update({
			secrets: deck.secrets.map((secret) =>
				this.removeSecretOptionFromSecret(secret, secretCardId),
			) as readonly BoardSecret[],
		} as DeckState);
	}

	public removeSecretOptionFromSecrets(
		secrets: readonly BoardSecret[],
		secretCardId: string,
	): readonly BoardSecret[] {
		return secrets.map((secret) => this.removeSecretOptionFromSecret(secret, secretCardId));
	}

	public findEntityInGameState(gameState: EventGameState, entityId: number): EntityGameState {
		const playerState: PlayerGameState = gameState.Player || ({} as PlayerGameState);
		const opponentState: PlayerGameState = gameState.Opponent || ({} as PlayerGameState);
		const allEntities = [
			...(playerState.Board || []),
			...(playerState.Hand || []),
			...(opponentState.Board || []),
			...(opponentState.Hand || []),
		];
		return allEntities.find((entity) => entity.entityId === entityId);
	}

	public removeSecretOptionFromSecret(secret: BoardSecret, secretCardId: string): BoardSecret {
		const newOptions: readonly SecretOption[] = secret.allPossibleOptions.map((option) =>
			option.cardId === secretCardId ? option.update({ isValidOption: false } as SecretOption) : option,
		);
		return secret.update({
			allPossibleOptions: newOptions,
		} as BoardSecret);
	}

	private normalizeCardId(cardId: string, shouldNormalize: boolean): string {
		if (!shouldNormalize) {
			return cardId;
		}
		return getBaseCardId(cardId);
	}
}
