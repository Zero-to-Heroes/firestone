import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class FirstPlayerParser implements EventParser {
	constructor() {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.FIRST_PLAYER;
	}

	parse(currentState: GameState, gameEvent: GameEvent): GameState {
		const [, , localPlayer, entityId] = gameEvent.parse();
		const isPlayer = entityId === localPlayer.Id;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newDeck = Object.assign(new DeckState(), deck, {
			isFirstPlayer: true,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return DeckEvents.FIRST_PLAYER;
	}
}
