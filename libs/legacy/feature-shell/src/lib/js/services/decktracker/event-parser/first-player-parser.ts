import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class FirstPlayerParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.FIRST_PLAYER;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
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
		return GameEvent.FIRST_PLAYER;
	}
}
