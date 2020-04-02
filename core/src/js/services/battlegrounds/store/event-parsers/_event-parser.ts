import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';

export interface EventParser {
	applies(gameEvent: BattlegroundsStoreEvent, state?: BattlegroundsState): boolean;
	parse(currentState: BattlegroundsState, gameEvent: BattlegroundsStoreEvent): Promise<BattlegroundsState>;
}
