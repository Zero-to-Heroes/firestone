import { GameState } from '@firestone/game-state';

import { GameStateEvent } from '@firestone/app/common';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { EventParser } from './event-parser';

export class ArchetypeCategorizationEvent implements GameStateEvent {
	public static EVENT_NAME = 'ARCHETYPE_CATEGORIZATION';

	public type = ArchetypeCategorizationEvent.EVENT_NAME;

	constructor(public readonly archetypeId: number) {}
}

export class ArchetypeCategorizationParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: ArchetypeCategorizationEvent): Promise<GameState> {
		const archetypeId = gameEvent.archetypeId;
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
		return ArchetypeCategorizationEvent.EVENT_NAME;
	}
}
