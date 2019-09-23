import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { AllCardsService } from '../../all-cards.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardPlayedFromHandParser implements EventParser {
	constructor(private deckParser: DeckParserService, private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.CARD_PLAYED;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = DeckManipulationHelper.findCardInZone(deck.hand, cardId, entityId);
		// console.log('[card-played-from-hand] card in zone', card, deck.hand, cardId, entityId);

		const newHand: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(
			deck.hand,
			cardId,
			entityId,
		);
		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
		const isOnBoard = refCard && refCard.type === 'Minion';
		const newBoard: readonly DeckCard[] = isOnBoard
			? DeckManipulationHelper.addSingleCardToZone(deck.board, card)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: DeckManipulationHelper.addSingleCardToZone(deck.otherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			board: newBoard,
			otherZone: newOtherZone,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_PLAYED_FROM_HAND;
	}
}
