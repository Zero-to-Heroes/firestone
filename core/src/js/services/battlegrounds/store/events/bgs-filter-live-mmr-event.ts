import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsFilterLiveMmrEvent extends BattlegroundsStoreEvent {
	constructor(public readonly filterByLiveMmr: boolean, public readonly percentiles: readonly MmrPercentile[]) {
		super('BgsFilterLiveMmrEvent');
	}
}
