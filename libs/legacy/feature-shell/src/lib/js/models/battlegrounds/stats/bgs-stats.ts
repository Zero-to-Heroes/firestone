import { BgsGlobalHeroStat2, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '../../../services/utils';

export class BgsStats {
	readonly lastUpdateDate: string;
	readonly mmrPercentiles: readonly MmrPercentile[];
	readonly allTribes: readonly Race[];
	readonly heroStats: readonly BgsGlobalHeroStat2[];

	readonly initComplete: boolean = false;

	public static create(result: Partial<NonFunctionProperties<BgsStats>>) {
		return Object.assign(new BgsStats(), result);
	}

	public update(base: Partial<NonFunctionProperties<BgsStats>>) {
		return Object.assign(new BgsStats(), this, base);
	}
}
