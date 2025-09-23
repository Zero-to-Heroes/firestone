import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameEvent } from '@firestone/game-state';
import { GameState } from '@firestone/game-state';
import { EventParser } from '../event-parser';

export class BgsBloodGemBuffChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame.update({
					bloodGemAttackBuff: gameEvent.additionalData.attack,
					bloodGemHealthBuff: gameEvent.additionalData.health,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.BLOOD_GEM_BUFF_CHANGED;
	}
}
