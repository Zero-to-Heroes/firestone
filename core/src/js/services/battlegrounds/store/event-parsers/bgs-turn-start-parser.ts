import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsTurnStartEvent } from '../events/bgs-turn-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsTurnStartParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTurnStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTurnStartEvent): Promise<BattlegroundsState> {
		console.log('updating turn', currentState);
		return currentState.update({
			currentGame: currentState.currentGame.update({
				currentTurn: Math.ceil(event.turnNumber / 2),
			} as BgsGame),
		} as BattlegroundsState);
	}
}
