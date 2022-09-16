export class BgsHeroStat {
	readonly id: string;
	readonly baseCardId?: string;
	readonly heroPowerCardId: string;
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
	readonly playerGamesPlayed: number;
	readonly playerTop4: number;
	readonly playerTop1: number;
	readonly lastPlayedTimestamp: number;
	readonly warbandStats: readonly { turn: number; totalStats: number }[];
	readonly combatWinrate: readonly { turn: number; winrate: number }[];
	readonly placementDistribution: readonly {
		rank: number;
		totalMatches: number;
	}[];
	readonly playerPlacementDistribution: readonly {
		rank: number;
		totalMatches: number;
	}[];

	public static create(base: BgsHeroStat): BgsHeroStat {
		return Object.assign(new BgsHeroStat(), base);
	}
}

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
	readonly playerGamesPlayed: number;
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

	public static create(base: BgsHeroStat): BgsHeroStat {
		return Object.assign(new BgsHeroStat(), base);
	}
}

export type BgsHeroTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
