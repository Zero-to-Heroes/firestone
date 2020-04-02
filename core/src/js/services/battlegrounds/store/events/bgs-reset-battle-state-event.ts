import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsResetBattleStateEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsResetBattleStateEvent');
	}
}
