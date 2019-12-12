import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { BattlegroundsEvent } from '../events/battlegrounds-event';
import { BattlegroundsHidePlayerInfoEvent } from '../events/battlegrounds-hide-player-info-event';
import { EventParser } from './event-parser';

export class BattlegroundsHidePlayerInfoParser implements EventParser {
	public applies(gameEvent: BattlegroundsEvent): boolean {
		return gameEvent.type === 'BattlegroundsHidePlayerInfoEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BattlegroundsHidePlayerInfoEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({ displayedPlayerCardId: null } as BattlegroundsState);
	}

	public event() {
		return 'BATTLEGROUNDS_HIDE_PLAYER_INFO';
	}
}
