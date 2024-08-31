import { BgsHeroTier } from '@firestone/battlegrounds/data-access';

export class BgsQuestStat {
	readonly id: string;
	readonly baseCardId?: string;
	readonly name: string;
	readonly totalMatches: number;
	readonly popularity: number;
	readonly averagePosition: number;
	readonly top4: number;
	readonly top1: number;
	readonly tier: BgsHeroTier;
	readonly playerPopularity: number;
	readonly playerAveragePosition: number;
	readonly playerAverageMmr: number;
	readonly playerAverageMmrGain: number;
	readonly playerAverageMmrLoss: number;
	readonly playerDataPoints: number;
	readonly playerTop4: number;
	readonly playerTop1: number;
	readonly lastPlayedTimestamp: number;
	readonly placementDistribution: readonly {
		rank: number;
		totalMatches: number;
	}[];
	readonly playerPlacementDistribution: readonly {
		rank: number;
		totalMatches: number;
	}[];

	public static create(base: BgsQuestStat): BgsQuestStat {
		return Object.assign(new BgsQuestStat(), base);
	}
}
