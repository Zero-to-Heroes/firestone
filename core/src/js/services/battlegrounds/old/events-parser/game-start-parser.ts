import { GameType } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/old/battlegrounds-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from './../../events-parser/event-parser';
export class GameStartParser implements EventParser {
	applies(gameEvent: GameEvent): boolean {
		return (
			gameEvent.type === GameEvent.MATCH_METADATA &&
			gameEvent.additionalData.metaData.GameType === GameType.GT_BATTLEGROUNDS
		);
	}

	async parse(): Promise<BattlegroundsState> {
		return new BattlegroundsState();
	}

	public event() {
		return GameEvent.GAME_START;
	}
}
