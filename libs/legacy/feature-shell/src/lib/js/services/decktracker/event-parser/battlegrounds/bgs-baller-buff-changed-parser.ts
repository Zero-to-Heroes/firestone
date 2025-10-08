import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameEvent, GameState } from '@firestone/game-state';
import { EventParser } from '../_event-parser';

export class BgsBallerBuffChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
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
