import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameEvent } from '@firestone/app/common';
import { GameState } from '@firestone/game-state';
import { EventParser } from '../event-parser';

export class BgsTotalMagnetizedChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame.update({
					magnetized: gameEvent.additionalData.newValue,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.TOTAL_MAGNETIZE_CHANGED;
	}
}
