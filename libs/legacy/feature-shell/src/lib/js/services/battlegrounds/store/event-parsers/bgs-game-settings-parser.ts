import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsGameSettingsEvent } from '../events/bgs-game-settings-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsGameSettingsParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsGameSettingsEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsGameSettingsEvent): Promise<BattlegroundsState> {
		console.debug('bgs game settings', event);
		return currentState.update({
			currentGame: currentState.currentGame?.update({
				hasPrizes: event.event.additionalData.battlegroundsPrizes,
			} as BgsGame),
		} as BattlegroundsState);
	}
}
