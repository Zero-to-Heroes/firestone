import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class GameStartParser implements EventParser {
	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.GAME_START;
	}

	async parse(): Promise<BattlegroundsState> {
		return new BattlegroundsState();
	}

	public event() {
		return GameEvent.GAME_START;
	}
}
