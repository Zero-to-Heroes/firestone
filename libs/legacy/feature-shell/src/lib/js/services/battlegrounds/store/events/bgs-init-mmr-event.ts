import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsInitMmrEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsInitMmrEvent' as const;
	constructor(
		public readonly mmrPercentiles: readonly MmrPercentile[],
		public readonly mmrPercentilesDuo: readonly MmrPercentile[],
	) {
		super('BgsInitMmrEvent');
	}
}
