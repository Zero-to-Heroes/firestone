import { BgsGlobalHeroStat2, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';

export class BgsStats {
	readonly lastUpdateDate: string;
	readonly mmrPercentiles: readonly MmrPercentile[];
	readonly allTribes: readonly Race[];
	readonly heroStats: readonly BgsGlobalHeroStat2[];

	public static create(result: BgsStats) {
		return Object.assign(new BgsStats(), result);
	}

	public update(base: BgsStats) {
		return Object.assign(new BgsStats(), this, base);
	}
}
