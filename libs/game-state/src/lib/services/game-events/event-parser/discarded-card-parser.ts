import { GameTag } from '@firestone-hs/reference-data';

import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class DiscardedCardParser implements EventParser {
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

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(deck.hand, card!.cardId, entityId);
		// console.debug('[discarded-card] removedCard', removedCard);

		// See card-played-from-hand
		let newDeck = deck.deck; // this.helper.updateDeckForAi(gameEvent, currentState, removedCard);

		// See card-played-from-hand
		if (!removedCard?.cardId && cardId && !gameEvent.additionalData?.transientCard) {
			const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
				newDeck,
				cardId,
				entityId,
				deck.deckList.length === 0,
			);
			// console.debug('[discarded-card] removedCardFromDeck', removedCardFromDeck);

			if (removedCardFromDeck) {
				newDeck = newDeckAfterReveal;
			}
		}

		let board = deck.board;
		if (!!gameEvent.additionalData.originEntityId) {
			const originCard = board.find((e) => e.entityId === gameEvent.additionalData.originEntityId);
			const newOriginCard: DeckCard | null = !originCard
				? null
				: originCard.update({
						relatedCardIds: [cardId, ...(originCard.relatedCardIds ?? [])],
					});
			board = !newOriginCard ? board : this.helper.replaceCardInZone(board, newOriginCard);
		}

		const refCard = getProcessedCard(cardId, entityId, deck, this.allCards, true);
		// console.debug(
		// 	'[discarded-card] refCard',
		// 	refCard,
		// 	card.refManaCost,
		// 	refCard.cost,
		// 	removedCard?.tags?.[GameTag.COST],
		// );
		const cardWithZone = card!.update({
			zone: 'DISCARD',
			refManaCost: card!.refManaCost ?? refCard.cost ?? removedCard?.tags?.[GameTag.COST],
		} as DeckCard);
		const newOther: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			cardWithZone,
			this.allCards,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			additionalKnownCardsInHand: deck.additionalKnownCardsInHand.filter(
				(c, i) => c !== cardId || deck.additionalKnownCardsInHand.indexOf(c) !== i,
			),
			additionalKnownCardsInDeck: deck.additionalKnownCardsInDeck.filter(
				(c, i) => c !== cardId || deck.additionalKnownCardsInDeck.indexOf(c) !== i,
			),
			otherZone: newOther,
			deck: newDeck,
			board: board,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.DISCARD_CARD;
	}
}
