import { Injectable } from '@angular/core';
import { getBaseCardId } from '@firestone-hs/reference-data';
import { BoardSecret, DeckCard, DeckState, GameState, SecretOption } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { EntityGameState, GameState as EventGameState, GameEvent, PlayerGameState } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';

@Injectable()
export class DeckManipulationHelper {
	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	public removeSingleCardFromZone(
		zone: readonly DeckCard[],
		cardId: string,
		entityId: number,
		removeFillerCard = false,
		normalizeUpgradedCards = true,
		cardInfos: { cost?: number } = null,
	): readonly [readonly DeckCard[], DeckCard] {
		const normalizedCardId = this.normalizeCardId(cardId, normalizeUpgradedCards);

		// We have the entityId, so we just remove it
		if (!!entityId && zone.some((card) => card.entityId === entityId)) {
			return [
				zone.map((card: DeckCard) => (card.entityId === entityId ? null : card)).filter((card) => card),
				zone.find((card: DeckCard) => card.entityId === entityId),
			];
		}

		if (!normalizedCardId) {
			// If there are some "filler" cards (ie cards that exist only so that the deck has the right amount
			// of cards), we remove one
			if (
				removeFillerCard &&
				zone.some((card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId)
			) {
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
			// We don't have the entityId, and the cardId is not provided, so we return
			return [zone, null];
		}

		// Remove using the card id
		let hasRemovedOnce = false;
		let removedCard = null;
		const result = [];
		// By default, we don't want to remove a card with a known entity ID, as the entityId is some useful info
		// on the card. We only do so if:
		// a) no card matches the known entityId,
		// b) we find a card that matches our input card id and
		// c) all such cards have a valid entityId (typically the case with Soul Fragments)
		// However, this means that, when we don't know the deck list, and the discover offers us twice the same card
		// from our deck, we will update the first card with the entityId of the second card, and fail to create a
		// new card in the deck
		// Test scenario: no-deck mode, discover / dredge and get offered the same card twice
		// So we should have a way to force the utils to match the entityId
		const shouldIgnoreEntityId =
			// TODO: test with soul fragments?
			false &&
			!zone.filter((card) => card.entityId === entityId).length &&
			zone.some((card) => this.normalizeCardId(card.cardId, normalizeUpgradedCards) === normalizedCardId) &&
			zone
				.filter((card) => this.normalizeCardId(card.cardId, normalizeUpgradedCards) === normalizedCardId)
				.every((card) => card.entityId);
		for (const card of zone) {
			// We don't want to remove a card if it has a different entityId
			const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
			// Here we don't want to remove a card with a known entity id, as it might conflict
			// with another
			if (!hasRemovedOnce && refCardId === normalizedCardId && (shouldIgnoreEntityId || !card.entityId)) {
				hasRemovedOnce = true;
				removedCard = card;
				continue;
			}
			result.push(card);
		}

		if (!removedCard) {
			// First remove cards that are not exactly fillers, but unknown cards that we can match based
			// on some characteristic of the card
			const drawnCard = normalizedCardId ? this.allCards.getCard(normalizedCardId) : null;
			if (drawnCard) {
				const candidates = zone
					.filter((card) => card.cardMatchCondition)
					.filter((card) => card.cardMatchCondition(drawnCard, cardInfos));
				if (candidates?.length) {
					let hasRemovedOnce = false;
					const result = zone.filter(
						(card) => !card.cardMatchCondition || !card.cardMatchCondition(drawnCard, cardInfos),
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
					return [result, removedCard];
				}
			}
		}

		if (!removedCard && removeFillerCard) {
			if (zone.some((card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId)) {
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
			console.debug('could not find card to remove', cardId, entityId, cardInfos, zone);
			// console.warn('could not find card to remove', cardId, entityId, cardInfos);
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
			// In case of reconnects, dead minions are "created in graveyard", but when minions die, we
			// oppose their entityId
			zone.filter((card) => card.entityId === cardTemplate.entityId || card.entityId === -cardTemplate.entityId)
				.length > 0
		) {
			return zone;
		}
		const newCard = DeckCard.create({
			...cardTemplate,
			buffingEntityCardIds: keepBuffs ? cardTemplate.buffingEntityCardIds : undefined,
			buffCardIds: keepBuffs ? cardTemplate.buffCardIds : undefined,
			metaInfo: {
				// Keep the turn at which it entered hand, if present
				...cardTemplate.metaInfo,
				turnAtWhichCardEnteredCurrentZone: undefined,
			},
		} as DeckCard);

		return [...zone, newCard];
	}

	public updateCardInDeck(
		deck: DeckState,
		card: DeckCard,
		isPlayer: boolean,
		forceUseEntityIdInDeck = false,
	): DeckState {
		if (!card?.entityId) {
			console.warn('missing entityId for card update', card);
			return deck;
		}

		// We don't always want to hide the entityId in hand. Typically, when the entityId + cardId is known beflorehand,
		// we can keep it because this won't lead to an info leak (since we already know everything there is to
		// know about the card)
		const shouldKeepEntityIdInHand = isPlayer || (!!card.entityId && !!card.cardId);
		const shouldKeepEntityIdInDeck = forceUseEntityIdInDeck;
		return deck.update({
			hand: this.updateCardInZone(deck.hand, card.entityId, card.cardId, card, !shouldKeepEntityIdInHand),
			board: this.updateCardInZone(deck.board, card.entityId, card.cardId, card),
			// When we update a card in the deck, we shouldn't know exactly what their entityId is
			// as this could lead to info leaks
			// However, there are cases where you want to keep the entityId because you know exactly what card was updated,
			// like when linking an entity after a dredge
			deck: this.updateCardInZone(deck.deck, card.entityId, card.cardId, card, !shouldKeepEntityIdInDeck),
			otherZone: this.updateCardInZone(deck.otherZone, card.entityId, card.cardId, card),
		} as DeckState);
	}

	public updateCardInZone(
		zone: readonly DeckCard[],
		entityId: number,
		cardId: string,
		newCard: DeckCard,
		hideEntityId = false,
	): readonly DeckCard[] {
		if (!cardId) {
			return zone;
		}
		return zone.map((card) =>
			card.entityId !== entityId
				? card
				: card.update(newCard).update({
						entityId: hideEntityId ? null : entityId,
						cardId: cardId,
						cardName: this.i18n.getCardName(cardId),
				  } as DeckCard),
		);
	}

	public trueFindCardInZone(
		zone: readonly DeckCard[],
		cardId: string,
		entityId: number,
		normalizeUpgradedCards = true,
	): DeckCard {
		const normalizedCardId = this.normalizeCardId(cardId, normalizeUpgradedCards);
		if (entityId) {
			const found = zone.find((card) => card.entityId === entityId);
			if (found && cardId) {
				return found;
			} else if (found) {
				return found;
			}
			if (cardId) {
				const idByCardId = zone.find((card) => {
					const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
					return refCardId === normalizedCardId && !card.entityId;
				});
				if (idByCardId) {
					return idByCardId;
				}
			}
		}
		if (!cardId) {
			return null;
		}

		const found =
			// Avoid picking card at the bottom of the deck first if possible
			zone.find((card) => {
				const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
				return refCardId === normalizedCardId && !card.entityId && card.positionFromBottom == null;
			}) ??
			zone.find((card) => {
				const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
				return refCardId === normalizedCardId && !card.entityId;
			}) ??
			// Without this, we can't draw cards that were specifically put back in our deck with special attributes
			// (like Fizzle's Snapshot).
			// I'm not sure what the issue could be in this case, so wait and see if this causes an info leak of some sort?
			zone.find((card) => {
				const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
				return refCardId === normalizedCardId;
			});
		return found;
	}

	// Warning: this also update the card, so is not suitable for a pure "find" request
	public findCardInZone(
		zone: readonly DeckCard[],
		cardId: string,
		entityId: number,
		normalizeUpgradedCards = true,
		createCardIfEmpty = true,
	): DeckCard {
		if (!cardId?.length && !entityId) {
			return DeckCard.create();
		}
		const normalizedCardId = this.normalizeCardId(cardId, normalizeUpgradedCards);
		// Explicit search by entity id
		if (entityId) {
			const found = zone.find((card) => Math.abs(card.entityId) === Math.abs(entityId));
			//console.debug('[findCardInZone] found card', found, entityId, cardId, zone);
			if (!found) {
				// Card hasn't been found, so we provide a default return
				if (cardId) {
					const idByCardId = zone.find((card) => {
						const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
						return refCardId === normalizedCardId && !card.entityId;
					});
					//console.debug('[findCardInZone] idByCardId', idByCardId, entityId, cardId, zone);
					if (idByCardId) {
						const card = this.allCards.getCard(normalizedCardId);
						return idByCardId.update({
							entityId: entityId,
							cardId: cardId,
							cardName: card && this.i18n.getCardName(card.id),
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
			if (found && cardId && !found.cardId && createCardIfEmpty) {
				const card = this.allCards.getCard(cardId);
				return found.update({
					cardId: cardId,
					cardName: (card && this.i18n.getCardName(card.id)) || found.cardName,
				} as DeckCard);
			}
			if (found) {
				return found;
			}
		}
		// Search by cardId only
		// Do we also want to search by cardId if we have an entityId but couldn't find anything? Are there cases where we
		// add cards to a zone without an entityId, but with a cardId?
		// I'll add warning logs to try and keep track of this
		if (cardId) {
			if (entityId && process.env.NODE_ENV !== 'production') {
				// console.warn('[findCardInZone] not found with entityId, search by cardId', cardId, entityId, zone);
			}
			const found =
				// Avoid picking card at the bottom of the deck first if possible
				zone.find((card) => {
					const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
					return refCardId === normalizedCardId && !card.entityId && card.positionFromBottom == null;
				}) ??
				zone.find((card) => {
					const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
					return refCardId === normalizedCardId && !card.entityId;
				}) ??
				// Without this, we can't draw cards that were specifically put back in our deck with special attributes
				// (like Fizzle's Snapshot).
				// I'm not sure what the issue could be in this case, so wait and see if this causes an info leak of some sort?
				zone.find((card) => {
					const refCardId = this.normalizeCardId(card.cardId, normalizeUpgradedCards);
					return refCardId === normalizedCardId;
				});
			//console.debug('[findCardInZone] found card by cardid', found, entityId, cardId, zone);
			if (!found) {
				const card = this.allCards.getCard(cardId);
				//console.debug('[findCardInZone] not found, creating default card', card, entityId, cardId, zone);
				return DeckCard.create({
					cardId: cardId,
					cardName: card ? this.i18n.getCardName(card.id) : null,
					entityId: entityId,
				} as DeckCard);
			}
			return found;
		}
		console.error('invalid call to findCard', entityId, cardId);
		return DeckCard.create();
	}

	// public obfuscateCard(card: DeckCard): DeckCard {
	//
	// 	return card.update({
	// 		// entityId: undefined,
	// 		cardId: undefined,
	// 		creatorCardId: undefined,
	// 	} as DeckCard);
	// }

	public assignCardIdToEntity(deck: DeckState, entityId: number, cardId: string): DeckState {
		const cardInHand = this.findCardInZone(deck.hand, null, entityId);

		if (cardInHand && !cardInHand.cardId) {
			const newCard = cardInHand.update({
				cardId: cardId,
				cardName: this.i18n.getCardName(cardId),
			} as DeckCard);
			const newHand = this.replaceCardInZone(deck.hand, newCard);
			return Object.assign(new DeckState(), deck, {
				hand: newHand,
			} as DeckState);
		}
		return deck;
	}

	public removeCardFromDeck(deck: DeckState, entityId: number): DeckState {
		return deck.update({
			board: deck.board.filter((card) => card.entityId !== entityId),
			deck: deck.deck.filter((card) => card.entityId !== entityId),
			otherZone: deck.otherZone.filter((card) => card.entityId !== entityId),
			hand: deck.hand.filter((card) => card.entityId !== entityId),
		});
	}

	public replaceCardInZone(zone: readonly DeckCard[], newCard: DeckCard): readonly DeckCard[] {
		const cardIndex = zone.map((card) => card.entityId).indexOf(newCard.entityId);
		const newZone = [...zone];
		newZone[cardIndex] = newCard;
		return newZone;
	}

	public empiricReplaceCardInZone(
		zone: readonly DeckCard[],
		newCard: DeckCard,
		removeFillerCard: boolean,
		cardInfos: { cost?: number } = null,
	): readonly DeckCard[] {
		// removeFillerCard here doesn't always work - we need to consider the UnknownXXX as filler cards
		const [newZone, removedCard] = this.removeSingleCardFromZone(
			zone,
			newCard.cardId,
			newCard.entityId,
			removeFillerCard,
			false,
			cardInfos,
		);
		//console.debug('[empiricReplaceCardInZone] removedCard', removedCard, newCard, newZone);
		const updatedZone = this.addSingleCardToZone(newZone, newCard);
		//console.debug('[empiricReplaceCardInZone] updatedZone', updatedZone);
		return updatedZone;
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
		if (!isPlayer && currentState.opponentDeck.deckList && !removedCard?.creatorCardId && !removedCard?.cardId) {
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
