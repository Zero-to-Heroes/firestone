import { BgsGlobalHeroStat2, MmrPercentile } from '@firestone-hs/bgs-global-stats';

export class BgsStats {
	readonly lastUpdateDate: string;
	readonly mmrPercentiles: readonly MmrPercentile[];
	readonly heroStats: readonly BgsGlobalHeroStat2[];

	public static create(result: BgsStats) {
		return Object.assign(new BgsStats(), result);
	}

	public update(base: BgsStats) {
		return Object.assign(new BgsStats(), this, base);
	}
}
