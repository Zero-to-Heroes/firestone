import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsCombatStartEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsCombatStartEvent');
	}
}
