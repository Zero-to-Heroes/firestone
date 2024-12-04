import { RealTimeStatsState } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRealTimeStatsUpdatedEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsRealTimeStatsUpdatedEvent' as const;
	constructor(public readonly realTimeStatsState: RealTimeStatsState) {
		super('BgsRealTimeStatsUpdatedEvent');
	}
}
