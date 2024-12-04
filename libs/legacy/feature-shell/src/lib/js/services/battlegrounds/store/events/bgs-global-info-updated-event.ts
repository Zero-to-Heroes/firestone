import { BattlegroundsInfo } from '@firestone/memory';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGlobalInfoUpdatedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsGlobalInfoUpdatedEvent' as const;
	constructor(public readonly info: BattlegroundsInfo) {
		super('BgsGlobalInfoUpdatedEvent');
	}
}
