import { EventParser } from './event-parser';
import { GameEvent } from '../../../models/game-event';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { AllCardsService } from '../../all-cards.service';

export class MinionSummonedParser implements EventParser {
	constructor(private cards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.MINION_SUMMONED;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId);
		const card = Object.assign(new DeckCard(), {
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'PLAY',
		} as DeckCard);

		const newBoard: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(deck.board, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.MINION_SUMMONED;
	}
}
