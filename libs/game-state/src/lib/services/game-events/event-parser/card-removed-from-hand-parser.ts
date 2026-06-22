import { CardIds } from '@firestone-hs/reference-data';

import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper, reconcileCardInHandWithDeck } from './deck-manipulation-helper';

const CARD_IS_NOT_DESTROYED = [CardIds.Ursol_EDR_259];
const CARD_IS_NOT_ACTUALLY_MILLED = [CardIds.TheFinsBeyondTime_TIME_706];
const DEVOUR_CARDS = [CardIds.Isorath_CATA_481];

export class CardRemovedFromHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		let opponentDeck = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		console.debug('[card-removed-from-hand] card', `entityId:${entityId}__`, card);

		const previousHand = deck.hand;
		const [newHand, handRemovedCard] = this.helper.removeSingleCardFromZone(previousHand, cardId, entityId);
		console.debug('[card-removed-from-hand] handRemovedCard', `entityId:${entityId}__`, handRemovedCard);

		const reconciled = reconcileCardInHandWithDeck({
			removedCard: handRemovedCard,
			cardId,
			entityId,
			deck,
			deckCards: deck.deck,
			opponentDeck,
			helper: this.helper,
		});
		console.debug('[card-removed-from-hand] reconciled', `entityId:${entityId}__`, reconciled);
		const { additionalKnownCardsInDeck, deckCards: newDeck } = reconciled;
		opponentDeck = reconciled.opponentDeck;

		const refCard = getProcessedCard(card?.cardId, card?.entityId, deck, this.allCards);
		const isMilled = !CARD_IS_NOT_ACTUALLY_MILLED.includes(gameEvent.additionalData.removedByCardId as CardIds);
		const cardWithZone = card!.update({
			refManaCost: card!.refManaCost ?? refCard?.cost,
			// Not sure this is the right flag to use, but it's not "burned" either, but we want to have something to
			// indicate that the card was not played
			milled: isMilled,
			zone: 'SETASIDE',
		});

		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			cardWithZone,
			this.allCards,
			// So that the buffs from Secret Passage are kept. Maybe this will cause other info leaks, but
			// for now let's give it a try and document it when that happens
			true,
		);
		const isDestroyed = !CARD_IS_NOT_DESTROYED.includes(gameEvent.additionalData.removedByCardId as CardIds);
		const newPlayerDeck = deck.update({
			hand: newHand,
			additionalKnownCardsInHand: deck.additionalKnownCardsInHand.filter(
				(c, i) => c !== cardId || deck.additionalKnownCardsInHand.indexOf(c) !== i,
			),
			additionalKnownCardsInDeck: additionalKnownCardsInDeck,
			otherZone: newOtherZone,
			deck: newDeck,
			destroyedCardsInDeck: isDestroyed
				? [...deck.destroyedCardsInDeck, { cardId, entityId }]
				: deck.destroyedCardsInDeck,
		});

		opponentDeck = this.updateDevourerRelatedCards(opponentDeck, gameEvent, cardId);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			[!isPlayer ? 'playerDeck' : 'opponentDeck']: opponentDeck,
		});
	}

	private updateDevourerRelatedCards(opponentDeck: DeckState, gameEvent: GameEvent, eatenCardId: string): DeckState {
		const removedByCardId = gameEvent.additionalData.removedByCardId;
		const removedByEntityId = gameEvent.additionalData.removedByEntityId;
		if (!DEVOUR_CARDS.includes(removedByCardId as CardIds) || !eatenCardId) {
			return opponentDeck;
		}
		const devourerCard = this.helper.findCardInZone(opponentDeck.board, null, removedByEntityId);
		if (!devourerCard) {
			return opponentDeck;
		}
		const updatedDevourer = devourerCard.update({
			relatedCardIds: [...devourerCard.relatedCardIds, eatenCardId],
		});
		return opponentDeck.update({
			board: this.helper.replaceCardInZone(opponentDeck.board, updatedDevourer),
		});
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_HAND;
	}
}
