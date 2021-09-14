export class BgsHeroStat {
	readonly id: string;
	readonly baseCardId?: string;
	readonly heroPowerCardId: string;
	readonly name: string;
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
	// readonly playerTop4Percentage: number;
	readonly playerTop1: number;
	readonly lastPlayedTimestamp: number;
	// readonly playerTop1Percentage: number;
	// readonly tribesStat: readonly { tribe: string; percent: number }[];
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

export type BgsHeroTier = 'S' | 'A' | 'B' | 'C' | 'D';
