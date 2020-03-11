import { BattlegroundsState } from '../../../../models/battlegrounds/old/battlegrounds-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../../events-parser/event-parser';
import { BattlegroundsEvent } from '../../events/battlegrounds-event';
import { BattlegroundsShowPlayerInfoEvent } from '../events/battlegrounds-show-player-info-event';

export class BattlegroundsShowPlayerInfoParser implements EventParser {
	public applies(gameEvent: GameEvent | BattlegroundsEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BattlegroundsShowPlayerInfoEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: GameEvent | BattlegroundsShowPlayerInfoEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({
			displayedPlayerCardId: (event as BattlegroundsShowPlayerInfoEvent).playerCardId,
		} as BattlegroundsState);
	}

	public event() {
		return 'BATTLEGROUNDS_SHOW_PLAYER_INFO';
	}
}
