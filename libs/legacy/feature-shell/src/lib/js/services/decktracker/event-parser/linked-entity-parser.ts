import { CardIds, Zone } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { allowDirectFlaggingOfCardInOpponentHand } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { reverseIfNeeded } from './card-dredged-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class LinkedEntityParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (cardId === CardIds.DarkGiftToken_EDR_102t) {
			return currentState;
		}

		// The new card (that is usually being added to deck or hand)
		let isPlayerForFind = controllerId === localPlayer.PlayerId;
		console.debug('[linked-entity-parser] isPlayerForFind', cardId, isPlayerForFind, gameEvent);
		let deckInWhichToFindTheCard = isPlayerForFind ? currentState.playerDeck : currentState.opponentDeck;
		let newCard = deckInWhichToFindTheCard.findCard(entityId)?.card;
		// let revert = false;
		console.debug('[linked-entity-parser] newCard', newCard, entityId, isPlayerForFind, deckInWhichToFindTheCard);
		if (!newCard) {
			// Can happen because of Disarming Elemetal where we dredge in the other player's deck or Spy-O-Matic
			isPlayerForFind = !isPlayerForFind;
			deckInWhichToFindTheCard = isPlayerForFind ? currentState.playerDeck : currentState.opponentDeck;
			newCard = deckInWhichToFindTheCard.findCard(entityId)?.card;
			console.debug(
				'[linked-entity-parser] missing newCard, trying to find in other deck',
				newCard,
				entityId,
				isPlayerForFind,
				deckInWhichToFindTheCard,
			);
			if (newCard && reverseIfNeeded(false, newCard.lastAffectedByCardId)) {
				// revert = true;
			} else {
				// If we still don't find the card, revert to the initial values
				console.debug('[linked-entity-parser] missing newCard');
				isPlayerForFind = !isPlayerForFind;
				deckInWhichToFindTheCard = isPlayerForFind ? currentState.playerDeck : currentState.opponentDeck;
				newCard = DeckCard.create({
					cardId: cardId,
					cardName: this.allCards.getCard(cardId).name,
					entityId: entityId,
				} as DeckCard);
			}
		}

		currentState = currentState.update({
			playerDeck: isPlayerForFind ? deckInWhichToFindTheCard : currentState.playerDeck,
			opponentDeck: isPlayerForFind ? currentState.opponentDeck : deckInWhichToFindTheCard,
		});

		// The card that the new card is copied from
		const linkedEntityControllerId = gameEvent.additionalData.linkedEntityControllerId;
		const isPlayerForCardModification = linkedEntityControllerId === localPlayer.PlayerId;
		console.debug(
			'[linked-entity-parser] isPlayerForCardModification',
			isPlayerForCardModification,
			linkedEntityControllerId,
			localPlayer.PlayerId,
		);
		const deckInWhichToModifyTheCard = isPlayerForCardModification
			? currentState.playerDeck
			: currentState.opponentDeck;
		const originalCardInfo = deckInWhichToModifyTheCard.findCard(gameEvent.additionalData.linkedEntityId);
		const originalCard = originalCardInfo?.card;
		const originalZone = originalCardInfo?.zone;
		console.debug(
			'[linked-entity-parser] originalCard',
			originalCard,
			originalZone,
			newCard,
			gameEvent.additionalData.linkedEntityId,
			deckInWhichToModifyTheCard,
		);
		let newPlayerDeck: DeckState;
		if (originalCard) {
			console.debug(
				'[linked-entity-parser] originalCard',
				originalCard,
				originalZone,
				newCard,
				isPlayerForCardModification,
				allowDirectFlaggingOfCardInOpponentHand.includes(newCard.lastAffectedByCardId as CardIds),
			);

			// This looks pretty wonky...
			if (
				originalZone === 'hand' &&
				!isPlayerForCardModification &&
				allowDirectFlaggingOfCardInOpponentHand.includes(newCard.lastAffectedByCardId as CardIds)
			) {
				console.debug('[linked-entity-parser] updating card in hand', newCard, originalCard);
				const updatedCard = originalCard.update({
					cardId: newCard.cardId,
					cardName: this.allCards.getCard(cardId).name,
					// Because when cards are revealed when Dredged, we want to update the position for all the revealed cards,
					// even ones who already had a position previously
					positionFromBottom: newCard.positionFromBottom ?? originalCard.positionFromBottom,
					// When the card is in the setaside zone, we don't want to override the temporaryCard, because it is very likely a temp card
					temporaryCard: originalCard.zone === 'SETASIDE' ? originalCard.temporaryCard : undefined,
				} as DeckCard);
				newPlayerDeck = this.helper.updateCardInDeck(
					deckInWhichToModifyTheCard,
					updatedCard,
					isPlayerForCardModification,
					true,
				);
				newPlayerDeck = newPlayerDeck.update({
					additionalKnownCardsInHand: deckInWhichToModifyTheCard.additionalKnownCardsInHand.filter(
						(cardId) => cardId !== newCard.cardId,
					),
				});
				console.debug('[linked-entity-parser] newPlayerDeck in hand', newPlayerDeck);
			} else if (isPlayerForCardModification || originalZone !== 'hand') {
				const updatedCard = originalCard.update({
					cardId: newCard.cardId,
					cardName: this.allCards.getCard(cardId).name,
					// Because when cards are revealed when Dredged, we want to update the position for all the revealed cards,
					// even ones who already had a position previously
					positionFromBottom: newCard.positionFromBottom ?? originalCard.positionFromBottom,
					// When the card is in the setaside zone, we don't want to override the temporaryCard, because it is very likely a temp card
					temporaryCard: originalCard.zone === 'SETASIDE' ? originalCard.temporaryCard : undefined,
				} as DeckCard);
				console.debug(
					'[linked-entity-parser] updating card',
					isPlayerForCardModification,
					updatedCard,
					newCard,
					originalCard,
				);
				newPlayerDeck = this.helper.updateCardInDeck(
					deckInWhichToModifyTheCard,
					updatedCard,
					isPlayerForCardModification,
					true,
				);
				console.debug('[linked-entity-parser] newPlayerDeck', newPlayerDeck);
			}
			// When linking to a card in the opponent's hand, we need to be extra careful to limit info leaks
			else {
				newPlayerDeck = deckInWhichToModifyTheCard.update({
					additionalKnownCardsInHand: [...deckInWhichToModifyTheCard.additionalKnownCardsInHand, cardId],
				});
			}
		} else {
			// Can happen for BG heroes
			if (gameEvent.additionalData.linkedEntityZone !== Zone.DECK) {
				return currentState;
			}
			// We don't add the initial cards in the deck, so if no card is found, we create it
			// ^ this is false, as copied-from-entity-id creates a card in the deck
			const updatedCard = DeckCard.create({
				...newCard,
				// Avoid info leak where we add a card in the opponent's deck and link it to the entity id
				// (if we have that link, we will update the decklist in real time, and possibly even
				// flag the card in)
				entityId: isPlayerForCardModification ? gameEvent.additionalData.linkedEntityId : null,
				zone: undefined,
				temporaryCard: undefined,
			} as DeckCard);
			console.debug('[linked-entity-parser] adding card', isPlayerForCardModification, updatedCard);
			const intermediaryDeck = this.helper.removeSingleCardFromZone(
				deckInWhichToModifyTheCard.deck,
				updatedCard.cardId,
				updatedCard.entityId ?? gameEvent.additionalData.linkedEntityId, // To catch the card that has been added before
				true,
				true,
				// For Lady Prestor + Dredge interaction
				{
					cost: updatedCard.getEffectiveManaCost(),
				},
			)[0];
			const newDeck = this.helper.addSingleCardToZone(intermediaryDeck, updatedCard);
			newPlayerDeck = deckInWhichToModifyTheCard.update({
				deck: newDeck,
			} as DeckState);
		}

		return currentState.update({
			playerDeck: isPlayerForCardModification ? newPlayerDeck : currentState.playerDeck,
			opponentDeck: isPlayerForCardModification ? currentState.opponentDeck : newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.LINKED_ENTITY;
	}
}
