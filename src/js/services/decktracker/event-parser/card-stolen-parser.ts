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

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.log('Handling stolen card event', gameEvent, currentState);
		// Ideally ,this should just use the entity tags for the zone instead of
		// relying on finding the card somewhere
		const [cardId, , , entityId] = gameEvent.parse();
		const isPlayerStolenFrom = gameEvent.additionalData.newControllerId === gameEvent.opponentPlayer.PlayerId;

		const stolenFromDeck = isPlayerStolenFrom ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = DeckManipulationHelper.findCardInZone(stolenFromDeck.hand, null, entityId);
		// console.log('\tcard in hand', cardInHand, stolenFromDeck.hand);
		const cardInBoard = DeckManipulationHelper.findCardInZone(stolenFromDeck.board, null, entityId);
		// console.log('\tcard in board', cardInBoard, stolenFromDeck.board);
		const cardInDeck = DeckManipulationHelper.findCardInZone(stolenFromDeck.deck, null, entityId);
		// console.log('\tcard in deck', cardInDeck, stolenFromDeck.deck);

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
		// console.log('\tnew stolen deck', newStolenDeck);

		// Here we just keep the card in the same zone, but in the other deck. Another event will
		// trigger afterwards to put the card in the right zone, if needed
		const stealingToDeck = isPlayerStolenFrom ? currentState.opponentDeck : currentState.playerDeck;
		const stealingHand = cardInHand
			? DeckManipulationHelper.addSingleCardToZone(stealingToDeck.hand, cardInHand)
			: stealingToDeck.hand;
		const stealingBoard = cardInBoard
			? DeckManipulationHelper.addSingleCardToZone(stealingToDeck.board, cardInBoard)
			: stealingToDeck.board;
		const stealingDeck = cardInDeck
			? DeckManipulationHelper.addSingleCardToZone(
					stealingToDeck.deck,
					isPlayerStolenFrom ? DeckManipulationHelper.obfuscateCard(cardInDeck) : cardInDeck,
			  )
			: stealingToDeck.deck;
		// console.log('new stealing deck', stealingDeck, cardInDeck);
		// console.log('new stolen from deck', stolenFromDeck);
		const newStealingDeck = Object.assign(new DeckState(), stealingToDeck, {
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
