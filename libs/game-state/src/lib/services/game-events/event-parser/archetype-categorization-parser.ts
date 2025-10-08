import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class ArchetypeCategorizationParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const archetypeId = gameEvent.additionalData.archetypeId;
		if (!archetypeId) {
			return currentState;
		}

		return currentState.update({
			playerDeck: currentState.playerDeck.update({
				archetypeId: archetypeId,
			}),
		} as GameState);
	}

	event(): string {
		return GameEvent.ARCHETYPE_CATEGORIZATION;
	}
}
