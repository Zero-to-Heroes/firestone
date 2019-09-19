import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardStolenParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.CARD_STOLEN;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		console.log('Handling stolen card event');
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayerStolenFrom = controllerId === localPlayer.PlayerId;

		const stolenFromDeck = isPlayerStolenFrom ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = DeckManipulationHelper.findCardInZone(stolenFromDeck.hand, cardId, entityId);
		const cardInBoard = DeckManipulationHelper.findCardInZone(stolenFromDeck.board, cardId, entityId);
		const cardInDeck = DeckManipulationHelper.findCardInZone(stolenFromDeck.deck, cardId, entityId);

		const stolenHand = cardInHand
			? DeckManipulationHelper.removeSingleCardFromZone(stolenFromDeck.hand, cardId, entityId)
			: stolenFromDeck.hand;
		const stolenBoard = cardInBoard
			? DeckManipulationHelper.removeSingleCardFromZone(stolenFromDeck.board, cardId, entityId)
			: stolenFromDeck.board;
		const stolenDeck = cardInDeck
			? DeckManipulationHelper.removeSingleCardFromZone(stolenFromDeck.deck, cardId, entityId)
			: stolenFromDeck.deck;
		const newStolenDeck = Object.assign(new DeckState(), stolenFromDeck, {
			hand: stolenHand,
			board: stolenBoard,
			deck: stolenDeck,
		});

		const stealingToDeck = isPlayerStolenFrom ? currentState.opponentDeck : currentState.playerDeck;
		const stealingHand = cardInHand ? DeckManipulationHelper.addSingleCardToZone(stealingToDeck.hand, cardInHand) : stealingToDeck.hand;
		const stealingBoard = cardInBoard
			? DeckManipulationHelper.addSingleCardToZone(stealingToDeck.board, cardInBoard)
			: stealingToDeck.board;
		const stealingDeck = cardInDeck
			? DeckManipulationHelper.addSingleCardToZone(stealingToDeck.deck, DeckManipulationHelper.obfuscateCard(cardInDeck))
			: stealingToDeck.deck;
		const newStealingDeck = Object.assign(new DeckState(), stolenFromDeck, {
			hand: stealingHand,
			board: stealingBoard,
			deck: stealingDeck,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayerStolenFrom ? 'playerDeck' : 'opponentDeck']: newStolenDeck,
			[isPlayerStolenFrom ? 'opponentDeck' : 'playerDeck']: newStealingDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_STOLEN;
	}
}
