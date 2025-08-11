import { GameTag } from '@firestone-hs/reference-data';

import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, toTagsObject } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class MinionSummonedFromHandParser implements EventParser {
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
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(
			deck.hand,
			cardId,
			entityId,
			deck.deckList.length === 0,
		);

		let newDeck = deck.deck;
		// removedCard != null ? this.helper.updateDeckForAi(gameEvent, currentState, removedCard) : deck.deck;

		// This happens when we create a card in the deck, then leave it there when the opponent draws it
		// (to avoid info leaks). When they play it we won't find it in the "hand" zone, so we try
		// and see if it is somewhere in the deck
		if (!removedCard?.cardId && cardId) {
			const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
				newDeck,
				cardId,
				entityId,
				deck.deckList.length === 0,
			);

			if (removedCardFromDeck) {
				newDeck = newDeckAfterReveal;
			}
		}

		// Only minions end up on the board
		const refCard = getProcessedCard(cardId, entityId, deck, this.allCards);
		const isOnBoard = refCard && (refCard.type === 'Minion' || refCard.type === 'Location');
		const cardWithZone =
			card?.update({
				zone: isOnBoard ? 'PLAY' : undefined,
				temporaryCard: false,
				playTiming: isOnBoard ? GameState.playTiming++ : undefined,
				putIntoPlay: isOnBoard ? true : undefined,
				tags: toTagsObject(gameEvent.additionalData.tags),
				refManaCost: card?.refManaCost ?? refCard.cost ?? removedCard?.tags?.[GameTag.COST],
			}) ||
			DeckCard.create({
				entityId: entityId,
				cardId: cardId,
				cardName: refCard.name,
				refManaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: isOnBoard ? 'PLAY' : undefined,
				temporaryCard: false,
				playTiming: isOnBoard ? GameState.playTiming++ : undefined,
				putIntoPlay: isOnBoard ? true : undefined,
				tags: toTagsObject(gameEvent.additionalData.tags),
			});
		const newBoard: readonly DeckCard[] = isOnBoard
			? this.helper.addSingleCardToZone(deck.board, cardWithZone)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToOtherZone(deck.otherZone, cardWithZone, this.allCards);
		const newPlayerDeck = deck.update({
			hand: newHand,
			additionalKnownCardsInHand: deck.additionalKnownCardsInHand.filter(
				(c, i) => c !== cardId || deck.additionalKnownCardsInHand.indexOf(c) !== i,
			),
			additionalKnownCardsInDeck: deck.additionalKnownCardsInDeck.filter(
				(c, i) => c !== cardId || deck.additionalKnownCardsInDeck.indexOf(c) !== i,
			),
			board: newBoard,
			deck: newDeck,
			otherZone: newOtherZone,
			// cardsPlayedThisTurn: [...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[],
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.MINION_SUMMONED_FROM_HAND;
	}
}
