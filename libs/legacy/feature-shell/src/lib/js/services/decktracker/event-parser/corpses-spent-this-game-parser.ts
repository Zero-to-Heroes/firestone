import { DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { EventParser } from './event-parser';

export class CorpsesSpentThisGameParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			corpsesSpent: gameEvent.additionalData.value,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CORPSES_SPENT_THIS_GAME_CHANGED;
	}
}
