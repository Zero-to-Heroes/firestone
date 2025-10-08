import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { EventParser } from '../_event-parser';

export class BgsMmrAtStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const mmrAtStart = gameEvent.additionalData.mmrAtStart;
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame!.update({
					mmrAtStart: mmrAtStart,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_MMR_AT_START;
	}
}
