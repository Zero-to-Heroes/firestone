import { RealTimeStatsState } from '../real-time-stats/real-time-stats';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRealTimeStatsUpdatedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly realTimeStatsState: RealTimeStatsState) {
		super('BgsRealTimeStatsUpdatedEvent');
	}
}
