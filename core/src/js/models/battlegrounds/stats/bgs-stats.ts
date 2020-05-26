import { BgsHeroStat } from './bgs-hero-stat';

export class BgsStats {
	readonly heroStats: readonly BgsHeroStat[] = [];
	readonly currentBattlegroundsMetaPatch: number;

	public static create(result: any) {
		return Object.assign(new BgsStats(), result);
	}

	public update(base: BgsStats) {
		return Object.assign(new BgsStats(), this, base);
	}
}
