import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardStolenParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_STOLEN;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// Ideally ,this should just use the entity tags for the zone instead of
		// relying on finding the card somewhere
		const [cardId, , , entityId] = gameEvent.parse();
		//console.log('Handling stolen card event', cardId, gameEvent, currentState);
		const isPlayerStolenFrom = gameEvent.additionalData.newControllerId === gameEvent.opponentPlayer.PlayerId;

		const stolenFromDeck = isPlayerStolenFrom ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = this.helper.findCardInZone(stolenFromDeck.hand, null, entityId);
		// console.log('\tcard in hand', cardInHand, stolenFromDeck.hand);
		const cardInBoard = this.helper.findCardInZone(stolenFromDeck.board, null, entityId);
		// console.log('\tcard in board', cardInBoard, stolenFromDeck.board);
		const cardInDeck = this.helper.findCardInZone(stolenFromDeck.deck, null, entityId);
		// console.log('\tcard in deck', cardInDeck, stolenFromDeck.deck);
		const secret = stolenFromDeck.secrets.find((entity) => entity.entityId === entityId);

		const [stolenHand, removedCardFromHand] = cardInHand
			? this.helper.removeSingleCardFromZone(stolenFromDeck.hand, cardId, entityId)
			: [stolenFromDeck.hand, undefined];
		//console.log('\tnew stolen hand', stolenHand, removedCardFromHand);
		const [stolenBoard, removedFromBoard] = cardInBoard
			? this.helper.removeSingleCardFromZone(stolenFromDeck.board, cardId, entityId)
			: [stolenFromDeck.board, undefined];
		const [stolenDeck, removedFromDeck] = cardInDeck
			? this.helper.removeSingleCardFromZone(stolenFromDeck.deck, cardId, entityId)
			: [stolenFromDeck.deck, undefined];
		const stolenSecrets = stolenFromDeck.secrets.filter((entity) => entity.entityId !== entityId);

		// See card-played-from-hand
		let newDeck = stolenDeck;
		if (
			!isPlayerStolenFrom &&
			currentState.opponentDeck.deckList &&
			removedCardFromHand &&
			!removedCardFromHand.creatorCardId &&
			!removedCardFromHand.cardId
		) {
			const result = this.helper.removeSingleCardFromZone(stolenDeck, cardId, entityId);
			// const removedFromDeck = result[1];
			newDeck = result[0];
		}
		const newStolenDeck = Object.assign(new DeckState(), stolenFromDeck, {
			hand: stolenHand,
			board: stolenBoard,
			deck: newDeck,
			secrets: stolenSecrets,
		});

		// Here we just keep the card in the same zone, but in the other deck. Another event will
		// trigger afterwards to put the card in the right zone, if needed
		const stealingToDeck = isPlayerStolenFrom ? currentState.opponentDeck : currentState.playerDeck;
		const stealingHand = cardInHand
			? this.helper.addSingleCardToZone(
					stealingToDeck.hand,
					cardInHand.update({
						cardId: cardInHand.cardId || cardId,
						cardName: cardInHand.cardName || this.allCards.getCard(cardId).name,
					} as DeckCard),
			  )
			: stealingToDeck.hand;
		//console.log('\tnew stoling hand', stealingHand);
		const stealingBoard = cardInBoard
			? this.helper.addSingleCardToZone(
					stealingToDeck.board,
					cardInBoard.update({
						cardId: cardInBoard.cardId || cardId,
						cardName: cardInBoard.cardName || this.allCards.getCard(cardId).name,
					} as DeckCard),
			  )
			: stealingToDeck.board;
		const stealingDeck = cardInDeck
			? this.helper.addSingleCardToZone(
					stealingToDeck.deck,
					cardInDeck.update({
						cardId: cardInDeck.cardId || cardId,
						cardName: cardInDeck.cardName || this.allCards.getCard(cardId).name,
					} as DeckCard),
			  )
			: stealingToDeck.deck;
		const stealingSecrets = secret ? [...stealingToDeck.secrets, secret] : stealingToDeck.secrets;
		// console.log('new stealing deck', stealingDeck, cardInDeck);
		// console.log('new stolen from deck', stolenFromDeck);
		const newStealingDeck = Object.assign(new DeckState(), stealingToDeck, {
			hand: stealingHand,
			board: stealingBoard,
			deck: stealingDeck,
			secrets: stealingSecrets,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayerStolenFrom ? 'playerDeck' : 'opponentDeck']: newStolenDeck,
			[isPlayerStolenFrom ? 'opponentDeck' : 'playerDeck']: newStealingDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_STOLEN;
	}
}
