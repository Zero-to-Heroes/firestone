import { RealTimeStatsState } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRealTimeStatsUpdatedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly realTimeStatsState: RealTimeStatsState) {
		super('BgsRealTimeStatsUpdatedEvent');
	}
}
