import { CardType } from '@firestone-hs/reference-data';

import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, toTagsObject } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

// Needed to not show the shrine as part of the deck
export class CardOnBoardAtGameStart implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		// If we had a reconnect, this means we are not at "game start" anymore
		return !!state;
		// However, we need the event because it can tell us that some minions have left the opponent's
		// hand or deck
		// && !state.hasReconnected;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData.creatorCardId;
		// console.debug('[card-on-board-at-game-start] cardId', cardId, entityId, creatorCardId, gameEvent);

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const dbCard = getProcessedCard(cardId, entityId, deck, this.allCards);
		if (dbCard.type && CardType[dbCard.type.toUpperCase()] === CardType.HERO) {
			// Do nothing, as we don't want to add the starting hero to the deck tracker
			return currentState;
		}

		let card: DeckCard | null = null;
		let newDeck: readonly DeckCard[] = deck.deck;
		let newHand = deck.hand;

		if (card == null) {
			const cardInDeck = this.helper.trueFindCardInZone(deck.deck, cardId, entityId);
			// console.debug('[card-on-board-at-game-start] card in deck', cardInDeck, deck);
			if (cardInDeck != null && cardInDeck.entityId === entityId) {
				newDeck = this.helper.removeSingleCardFromZone(
					deck.deck,
					cardId,
					entityId,
					deck.deckList.length === 0,
				)[0];
				card = cardInDeck;
			}
		}
		if (card == null) {
			const cardIdHand = this.helper.trueFindCardInZone(deck.hand, cardId, entityId);
			// console.debug('[card-on-board-at-game-start] card in hand', cardIdHand, deck);
			if (cardIdHand != null && cardIdHand.entityId === entityId) {
				newHand = this.helper.removeSingleCardFromZone(
					deck.hand,
					cardId,
					entityId,
					deck.deckList.length === 0,
				)[0];
				card = cardIdHand;
			}
		}
		if (card == null) {
			card = this.helper.findCardInZone(deck.deck, cardId, entityId);
			newDeck = this.helper.removeSingleCardFromZone(deck.deck, cardId, entityId, deck.deckList.length === 0)[0];
		}
		// console.debug('[card-on-board-at-game-start] updated deck and hand', newDeck, newHand);

		// When reconnecting, we can also have the card info in hand
		const cardWithZone = card!.update({
			zone: 'PLAY',
			creatorCardId: creatorCardId,
			creatorEntityId: gameEvent.additionalData.creatorEntityId,
			temporaryCard: false,
			playTiming: GameState.playTiming++,
			putIntoPlay: true,
			tags: gameEvent.additionalData.tags ? toTagsObject(gameEvent.additionalData.tags) : card!.tags,
		} as DeckCard);

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			board: newBoard,
			hand: newHand,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_ON_BOARD_AT_GAME_START;
	}
}
