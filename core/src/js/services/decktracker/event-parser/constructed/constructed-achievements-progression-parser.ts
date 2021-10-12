import { GameState } from '../../../../models/decktracker/game-state';
import { GameStateEvent } from '../../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../../models/game-event';
import { ConstructedAchievementsProgressionEvent } from '../../event/constructed-achievements-progression-event';
import { EventParser } from '../event-parser';

export class ConstructedAchievementsProgressionParser implements EventParser {
	applies(gameEvent: GameStateEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ACHIEVEMENT_PROGRESS;
	}

	async parse(currentState: GameState, event: ConstructedAchievementsProgressionEvent): Promise<GameState> {
		// const constructedState = currentState.constructedState.update({
		// 	initialAchievementsProgress: currentState.constructedState.initialAchievementsProgress ?? event.progress,
		// 	currentAchievementsProgress: event.progress,
		// } as ConstructedState);

		return currentState.update({
			// constructedState: constructedState,
		} as GameState);
	}

	event(): string {
		return GameEvent.ACHIEVEMENT_PROGRESS;
	}
}
