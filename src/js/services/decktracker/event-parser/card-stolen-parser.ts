import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardStolenParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_STOLEN;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// console.log('Handling stolen card event', gameEvent, currentState);
		// Ideally ,this should just use the entity tags for the zone instead of
		// relying on finding the card somewhere
		const [cardId, , , entityId] = gameEvent.parse();
		const isPlayerStolenFrom = gameEvent.additionalData.newControllerId === gameEvent.opponentPlayer.PlayerId;

		const stolenFromDeck = isPlayerStolenFrom ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = this.helper.findCardInZone(stolenFromDeck.hand, null, entityId);
		// console.log('\tcard in hand', cardInHand, stolenFromDeck.hand);
		const cardInBoard = this.helper.findCardInZone(stolenFromDeck.board, null, entityId);
		// console.log('\tcard in board', cardInBoard, stolenFromDeck.board);
		const cardInDeck = this.helper.findCardInZone(stolenFromDeck.deck, null, entityId);
		// console.log('\tcard in deck', cardInDeck, stolenFromDeck.deck);

		const stolenHand = cardInHand
			? this.helper.removeSingleCardFromZone(stolenFromDeck.hand, cardId, entityId)[0]
			: stolenFromDeck.hand;
		const stolenBoard = cardInBoard
			? this.helper.removeSingleCardFromZone(stolenFromDeck.board, cardId, entityId)[0]
			: stolenFromDeck.board;
		const stolenDeck = cardInDeck
			? this.helper.removeSingleCardFromZone(stolenFromDeck.deck, cardId, entityId)[0]
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
			? this.helper.addSingleCardToZone(stealingToDeck.hand, cardInHand)
			: stealingToDeck.hand;
		const stealingBoard = cardInBoard
			? this.helper.addSingleCardToZone(stealingToDeck.board, cardInBoard)
			: stealingToDeck.board;
		const stealingDeck = cardInDeck
			? this.helper.addSingleCardToZone(
					stealingToDeck.deck,
					isPlayerStolenFrom ? this.helper.obfuscateCard(cardInDeck) : cardInDeck,
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
