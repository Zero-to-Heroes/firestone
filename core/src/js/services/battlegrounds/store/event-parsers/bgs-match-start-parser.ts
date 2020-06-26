import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsMatchStartEvent } from '../events/bgs-match-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsInitParser } from './bgs-init-parser';
import { EventParser } from './_event-parser';

export class BgsMatchStartParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsMatchStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsMatchStartEvent): Promise<BattlegroundsState> {
		const newGame: BgsGame = BgsGame.create({} as BgsGame);
		return currentState.update({
			inGame: true,
			currentGame: newGame,
			forceOpen: true,
			stages: BgsInitParser.buildEmptyStages(),
		} as BattlegroundsState);
	}
}
