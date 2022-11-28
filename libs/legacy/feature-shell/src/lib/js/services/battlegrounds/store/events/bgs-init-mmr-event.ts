import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsInitMmrEvent extends BattlegroundsStoreEvent {
	constructor(public readonly mmrPercentiles: readonly MmrPercentile[]) {
		super('BgsInitMmrEvent');
	}
}
