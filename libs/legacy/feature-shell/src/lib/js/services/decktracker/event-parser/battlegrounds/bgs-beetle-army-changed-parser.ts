import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsBeetleArmyChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame.update({
					beetlesAttackBuff: gameEvent.additionalData.attack,
					beetlesHealthBuff: gameEvent.additionalData.health,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.BEETLE_ARMY_CHANGED;
	}
}
