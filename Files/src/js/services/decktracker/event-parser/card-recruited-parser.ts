import { EventParser } from './event-parser';
import { GameEvent } from '../../../models/game-event';
import { GameState } from '../../../models/decktracker/game-state';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class CardRecruitedParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.RECRUIT_CARD;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = DeckManipulationHelper.findCardInZone(deck.deck, cardId, entityId);

		const newDeck: readonly DeckCard[] = DeckManipulationHelper.removeSingleCardFromZone(deck.deck, cardId, entityId);
		const cardWithZone = Object.assign(new DeckCard(), card, {
			zone: 'PLAY',
		} as DeckCard);

		const newBoard: readonly DeckCard[] = DeckManipulationHelper.addSingleCardToZone(deck.board, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			board: newBoard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.RECRUIT_CARD;
	}
}
