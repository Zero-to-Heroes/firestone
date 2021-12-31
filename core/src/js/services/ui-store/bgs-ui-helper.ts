import { BgsGlobalHeroStat2, BgsHeroTier, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BgsActiveTimeFilterType } from '../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from '../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../models/patches';
import { getHeroPower, normalizeHeroCardId } from '../battlegrounds/bgs-utils';
import { CardsFacadeService } from '../cards-facade.service';
import { cutNumber, groupByFunction, sumOnArray } from '../utils';

export const buildHeroStats = (
	globalStats: BgsStats,
	playerMatches: readonly GameStat[],
	timeFilter: BgsActiveTimeFilterType,
	rankFilter: BgsRankFilterType,
	heroSortFilter: BgsHeroSortFilterType,
	patch: PatchInfo,
	allCards: CardsFacadeService,
): readonly BgsHeroStat[] => {
	if (!globalStats.heroStats?.length) {
		return [];
	}
	// TODO: add tribe filters
	const filteredGlobalStats = globalStats.heroStats
		.filter((stat) => stat.date === timeFilter)
		// Backward compatilibity
		.filter((stat) => stat.mmrPercentile === rankFilter);
	const groupedByHero = groupByFunction((stat: BgsGlobalHeroStat2) => stat.cardId)(filteredGlobalStats);
	const totalMatches = sumOnArray(filteredGlobalStats, (stat) => stat.totalMatches);
	const mmrThreshold: number = getMmrThreshold(rankFilter, globalStats.mmrPercentiles);
	const bgMatches = filterBgsMatchStats(playerMatches, timeFilter, mmrThreshold, patch);
	const heroStats: readonly BgsHeroStat[] = Object.keys(groupedByHero).map((heroCardId) =>
		buildHeroStat(heroCardId, groupedByHero[heroCardId], bgMatches, totalMatches, allCards),
	);
	const result = [...heroStats].sort(buildSortingFunction(heroSortFilter));
	return result;
};

const filterBgsMatchStats = (
	bgsMatchStats: readonly GameStat[],
	timeFilter: BgsActiveTimeFilterType,
	mmrThreshold: number,
	currentBattlegroundsMetaPatch: PatchInfo,
): readonly GameStat[] => {
	return bgsMatchStats
		.filter((stat) => filterType(stat, timeFilter, currentBattlegroundsMetaPatch))
		.filter((stat) => filterRank(stat, mmrThreshold));
};

const buildHeroStat = (
	heroCardId: string,
	stats: readonly BgsGlobalHeroStat2[],
	playerMatches: readonly GameStat[],
	totalMatches: number,
	allCards: CardsFacadeService,
): BgsHeroStat => {
	const playerGamesPlayed = playerMatches.filter(
		(stat) =>
			normalizeHeroCardId(stat.playerCardId, true, allCards) === normalizeHeroCardId(heroCardId, true, allCards),
	);
	const totalPlayerGamesPlayed = playerGamesPlayed.length;
	const playerPopularity = (100 * totalPlayerGamesPlayed) / playerMatches.length;
	const gamesWithMmr = playerGamesPlayed
		.filter((stat) => stat.newPlayerRank != null && stat.playerRank != null)
		.filter((stat) => isValidMmrDelta(parseInt(stat.newPlayerRank) - parseInt(stat.playerRank))) // Safeguard against season reset
		.filter((stat) => !isNaN(parseInt(stat.newPlayerRank) - parseInt(stat.playerRank)));
	const gamesWithPositiveMmr = gamesWithMmr.filter(
		(stat) => parseInt(stat.newPlayerRank) - parseInt(stat.playerRank) > 0,
	);
	const gamesWithNegativeMmr = gamesWithMmr.filter(
		(stat) => parseInt(stat.newPlayerRank) - parseInt(stat.playerRank) < 0,
	);
	const mergedStat: BgsGlobalHeroStat2 = mergeHeroStats(stats);
	const heroStat = convertToBgsHeroStat(mergedStat, totalMatches, allCards);
	return BgsHeroStat.create({
		...heroStat,
		playerGamesPlayed: totalPlayerGamesPlayed,
		playerPopularity: cutNumber(playerPopularity),
		playerAveragePosition: cutNumber(
			totalPlayerGamesPlayed === 0
				? 0
				: playerGamesPlayed.map((stat) => parseInt(stat.additionalResult)).reduce((a, b) => a + b, 0) /
						totalPlayerGamesPlayed,
		),
		playerAverageMmr: cutNumber(
			gamesWithMmr.length === 0
				? 0
				: gamesWithMmr
						.map((stat) => parseInt(stat.newPlayerRank) - parseInt(stat.playerRank))
						.reduce((a, b) => a + b, 0) / gamesWithMmr.length,
		),
		playerAverageMmrGain: cutNumber(
			gamesWithPositiveMmr.length === 0
				? 0
				: gamesWithPositiveMmr
						.map((stat) => parseInt(stat.newPlayerRank) - parseInt(stat.playerRank))
						.reduce((a, b) => a + b, 0) / gamesWithPositiveMmr.length,
		),
		playerAverageMmrLoss: cutNumber(
			gamesWithNegativeMmr.length === 0
				? 0
				: gamesWithNegativeMmr
						.map((stat) => parseInt(stat.newPlayerRank) - parseInt(stat.playerRank))
						.reduce((a, b) => a + b, 0) / gamesWithNegativeMmr.length,
		),
		playerTop4: cutNumber(
			totalPlayerGamesPlayed === 0
				? 0
				: (100 *
						playerGamesPlayed
							.map((stat) => parseInt(stat.additionalResult))
							.filter((position) => position <= 4).length) /
						totalPlayerGamesPlayed,
		),
		playerTop1: cutNumber(
			totalPlayerGamesPlayed === 0
				? 0
				: (100 *
						playerGamesPlayed
							.map((stat) => parseInt(stat.additionalResult))
							.filter((position) => position == 1).length) /
						totalPlayerGamesPlayed,
		),
		playerPlacementDistribution: buildPlayerPlacementDistribution(playerGamesPlayed),
		lastPlayedTimestamp: totalPlayerGamesPlayed === 0 ? null : playerGamesPlayed[0].creationTimestamp,
	} as BgsHeroStat);
};

const buildPlayerPlacementDistribution = (
	playerGamesPlayed: GameStat[],
): readonly { rank: number; totalMatches: number }[] => {
	const groupedByFinish: { [rank: string]: readonly GameStat[] } = groupByFunction(
		(stat: GameStat) => stat.additionalResult,
	)(playerGamesPlayed.filter((stat) => !!stat.additionalResult));
	const result = [];
	for (let i = 1; i <= 8; i++) {
		result.push({
			rank: i,
			totalMatches: groupedByFinish['' + i]?.length ?? 0,
		});
	}
	return result;
};

const convertToBgsHeroStat = (
	stat: BgsGlobalHeroStat2,
	totalMatches: number,
	allCards: CardsFacadeService,
): BgsHeroStat => {
	const avgPosition =
		sumOnArray(stat.placementDistribution, (info) => info.rank * info.totalMatches) /
		sumOnArray(stat.placementDistribution, (info) => info.totalMatches);
	const placementTotalMatches = sumOnArray(stat.placementDistribution, (info) => info.totalMatches);
	return {
		id: stat.cardId,
		heroPowerCardId: getHeroPower(stat.cardId),
		name: allCards.getCard(stat.cardId)?.name,
		totalMatches: stat.totalMatches,
		popularity: (100 * stat.totalMatches) / totalMatches,
		tier: buildBgsHeroTier(avgPosition),
		top1:
			(100 *
				sumOnArray(
					stat.placementDistribution.filter((info) => info.rank === 1),
					(info) => info.totalMatches,
				)) /
			placementTotalMatches,
		top4:
			(100 *
				sumOnArray(
					stat.placementDistribution.filter((info) => info.rank <= 4),
					(info) => info.totalMatches,
				)) /
			placementTotalMatches,
		averagePosition: avgPosition,
		warbandStats: stat.warbandStats
			.map((info) => ({
				turn: info.turn,
				totalStats: info.totalStats / info.dataPoints,
			}))
			.slice(0, 15) as readonly {
			turn: number;
			totalStats: number;
		}[],
		combatWinrate: stat.combatWinrate
			.map((info) => ({
				turn: info.turn,
				winrate: info.totalWinrate / info.dataPoints,
			}))
			.slice(0, 15) as readonly {
			turn: number;
			winrate: number;
		}[],
		placementDistribution: stat.placementDistribution,
	} as BgsHeroStat;
};

const buildBgsHeroTier = (averagePosition: number): BgsHeroTier | 'E' => {
	if (averagePosition < 3.7) {
		return 'S';
	} else if (averagePosition < 4.1) {
		return 'A';
	} else if (averagePosition < 4.4) {
		return 'B';
	} else if (averagePosition < 4.7) {
		return 'C';
	} else if (averagePosition < 5) {
		return 'D';
	}
	return 'E';
};

const mergeHeroStats = (stats: readonly BgsGlobalHeroStat2[]): BgsGlobalHeroStat2 => {
	const ref = stats[0];

	const combatWinrate: { turn: number; dataPoints: number; totalWinrate: number }[] = [];
	const maxTurnCw = Math.max(
		...stats
			.map((stat) => stat.combatWinrate)
			.filter((cw) => !!cw?.length)
			.map((cw) => cw.map((info) => info.turn))
			.reduce((a, b) => a.concat(b), []),
	);
	for (let i = 0; i < maxTurnCw; i++) {
		const cwForTurn = stats
			.map((stat) => stat.combatWinrate)
			.filter((cw) => !!cw?.length)
			// FIXME when missing info
			.map((cw) => cw.find((info) => info.turn === i))
			.filter((info) => info);
		combatWinrate.push({
			turn: i,
			dataPoints: sumOnArray(cwForTurn, (info) => info.dataPoints),
			totalWinrate: sumOnArray(cwForTurn, (info) => info.totalWinrate),
		});
	}

	const placementDistribution: { rank: number; totalMatches: number }[] = [];
	for (let i = 1; i <= 8; i++) {
		const placementsForRank = stats.map(
			(stat) => stat.placementDistribution.find((info) => info.rank === i) ?? { rank: i, totalMatches: 0 },
		);
		placementDistribution.push({
			rank: i,
			totalMatches: sumOnArray(placementsForRank, (info) => info.totalMatches),
		});
	}

	const warbandStats: { turn: number; dataPoints: number; totalStats: number }[] = [];
	const maxTurnWs = Math.max(
		...stats
			.map((stat) => stat.warbandStats)
			.filter((cw) => !!cw?.length)
			.map((cw) => cw.map((info) => info.turn))
			.reduce((a, b) => a.concat(b), []),
	);
	for (let i = 0; i < maxTurnWs; i++) {
		const wsForTurn = stats
			.map((stat) => stat.warbandStats)
			.filter((cw) => !!cw?.length)
			// FIXME when missing info
			.map((cw) => cw.find((info) => info.turn === i))
			.filter((info) => info);
		warbandStats.push({
			turn: i,
			dataPoints: sumOnArray(wsForTurn, (info) => info.dataPoints),
			totalStats: sumOnArray(wsForTurn, (info) => info.totalStats),
		});
	}

	return {
		cardId: ref.cardId,
		date: ref.date,
		totalMatches: sumOnArray(stats, (stat) => stat.totalMatches),
		combatWinrate: combatWinrate,
		placementDistribution: placementDistribution,
		warbandStats: warbandStats,
		// Not used at this point anymore
		mmrPercentile: ref.mmrPercentile,
		tribes: ref.tribes,
	};
};

const buildSortingFunction = (heroSortFilter: BgsHeroSortFilterType): ((a: BgsHeroStat, b: BgsHeroStat) => number) => {
	switch (heroSortFilter) {
		case 'games-played':
			return (a, b) => b.playerGamesPlayed - a.playerGamesPlayed;
		case 'mmr':
			return (a, b) => {
				if (!a.playerAverageMmr && !b.playerAverageMmr) {
					return b.playerGamesPlayed - a.playerGamesPlayed;
				}
				if (!a.playerAverageMmr) {
					return 1;
				}
				if (!b.playerAverageMmr) {
					return -1;
				}
				return b.playerAverageMmr - a.playerAverageMmr;
			};
		case 'last-played':
			return (a, b) => b.lastPlayedTimestamp - a.lastPlayedTimestamp;
		case 'average-position':
		default:
			return (a, b) => {
				if (!a.playerAveragePosition) {
					return 1;
				}
				if (!b.playerAveragePosition) {
					return -1;
				}
				return a.playerAveragePosition - b.playerAveragePosition;
			};
	}
};

const filterType = (stat: GameStat, timeFilter: BgsActiveTimeFilterType, patch: PatchInfo) => {
	if (!timeFilter) {
		return true;
	}

	switch (timeFilter) {
		case 'last-patch':
			// The issue here is that sometimes the patch number in the client is not the official patch number
			// (for some reason, the client stil logs the logs patch number)
			// So using the patch number as a reference doesn't really work anymore
			// Since the patch itself usually goes live in the evening, maybe we can just use the day after
			// as the start for the patch period
			return (stat.buildNumber >= patch.number ||
				stat.creationTimestamp > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000
			);
		case 'past-three':
			return Date.now() - stat.creationTimestamp <= 3 * 24 * 60 * 60 * 1000;
		case 'past-seven':
			return Date.now() - stat.creationTimestamp <= 7 * 24 * 60 * 60 * 1000;
		case 'all-time':
		default:
			return true;
	}
};

export const getMmrThreshold = (rankFilter: BgsRankFilterType, mmrPercentiles: readonly MmrPercentile[]): number => {
	const percentile = mmrPercentiles.find((p) => p.percentile === rankFilter);
	return percentile?.mmr ?? 0;
};

const filterRank = (stat: GameStat, mmrThreshold: number) => {
	return stat.playerRank && parseInt(stat.playerRank) >= mmrThreshold;
};

const isValidMmrDelta = (mmr: number): boolean => {
	return Math.abs(mmr) < 350;
};
