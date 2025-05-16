import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsMmrAtStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const mmrAtStart = gameEvent.additionalData.mmrAtStart;
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame.update({
					mmrAtStart: mmrAtStart,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_MMR_AT_START;
	}
}
