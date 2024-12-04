import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsCombatStartEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsCombatStartEvent' as const;
	constructor() {
		super('BgsCombatStartEvent');
	}
}
