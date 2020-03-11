import { BattlegroundsState } from '../../../../models/battlegrounds/old/battlegrounds-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from './../../events-parser/event-parser';

export class GameEndParser implements EventParser {
	applies(gameEvent: GameEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === GameEvent.GAME_END;
	}

	async parse(): Promise<BattlegroundsState> {
		return null;
	}

	public event() {
		return GameEvent.GAME_END;
	}
}
