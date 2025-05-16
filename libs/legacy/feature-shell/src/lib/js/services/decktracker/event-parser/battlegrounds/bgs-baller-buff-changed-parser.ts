import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsBallerBuffChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame.update({
					ballerBuff: gameEvent.additionalData.buff,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.BALLER_BUFF_CHANGED;
	}
}
