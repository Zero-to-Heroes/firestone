import { DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '@firestone/game-state';
import { EventParser } from './event-parser';

export class FatigueParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();
		const isPlayer = gameEvent.additionalData.entityId === localPlayer.Id;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			fatigue: gameEvent.additionalData.fatigueDamage,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.FATIGUE_DAMAGE;
	}
}
