import { BgsStats } from '../../../../models/battlegrounds/stats/bgs-stats';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsInitEvent extends BattlegroundsStoreEvent {
	constructor(public readonly bgsGlobalStats: BgsStats) {
		super('BgsInitEvent');
	}
}
