import { RealTimeStatsState } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRealTimeStatsUpdatedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly realTimeStatsState: RealTimeStatsState) {
		super('BgsRealTimeStatsUpdatedEvent');
	}
}
