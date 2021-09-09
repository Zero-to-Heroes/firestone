import { BgsGlobalHeroStat2, BgsHeroTier } from '@firestone-hs/bgs-global-stats';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BgsActiveTimeFilterType } from '../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from '../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../models/patches';
import { Preferences } from '../../models/preferences';
import { getHeroPower, normalizeHeroCardId } from '../battlegrounds/bgs-utils';
import { CardsFacadeService } from '../cards-facade.service';
import { cutNumber, groupByFunction, sumOnArray } from '../utils';

const filterBgsMatchStats = (
	bgsMatchStats: readonly GameStat[],
	timeFilter: BgsActiveTimeFilterType,
	rankFilter: BgsRankFilterType,
	currentBattlegroundsMetaPatch: PatchInfo,
): readonly GameStat[] => {
	return bgsMatchStats
		.filter((stat) => filterType(stat, Preferences.updateTimeFilter(timeFilter), currentBattlegroundsMetaPatch))
		.filter((stat) => filterRank(stat, rankFilter));
};

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
	const updatedTimeFilter: BgsActiveTimeFilterType = Preferences.updateTimeFilter(timeFilter);
	// TODO: add MMR, tribe filters
	const filteredGlobalStats = globalStats.heroStats
		.filter((stat) => stat.date === updatedTimeFilter)
		.filter((stat) => stat.mmrPercentile === 100);
	// console.debug('building hero stats', filteredGlobalStats);
	const groupedByHero = groupByFunction((stat: BgsGlobalHeroStat2) => stat.cardId)(filteredGlobalStats);
	const totalMatches = sumOnArray(filteredGlobalStats, (stat) => stat.totalMatches);
	const bgMatches = filterBgsMatchStats(playerMatches, updatedTimeFilter, rankFilter, patch);
	const heroStats: readonly BgsHeroStat[] = Object.keys(groupedByHero).map((heroCardId) =>
		buildHeroStat(heroCardId, groupedByHero[heroCardId], bgMatches, totalMatches, allCards),
	);
	return [...heroStats].sort(buildSortingFunction(heroSortFilter));
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
		lastPlayedTimestamp: totalPlayerGamesPlayed === 0 ? null : playerGamesPlayed[0].creationTimestamp,
	} as BgsHeroStat);
};

const convertToBgsHeroStat = (
	stat: BgsGlobalHeroStat2,
	totalMatches: number,
	allCards: CardsFacadeService,
): BgsHeroStat => {
	// const debug = stat.cardId === CardIds.NonCollectible.Neutral.MasterNguyen;
	// debug && console.debug('stat', stat);

	const avgPosition =
		sumOnArray(stat.placementDistribution, (info) => info.rank * info.totalMatches) /
		sumOnArray(stat.placementDistribution, (info) => info.totalMatches);
	// debug &&
	// 	console.debug(
	// 		'avgPosition',
	// 		avgPosition,
	// 		sumOnArray(stat.placementDistribution, (info) => info.rank * info.totalMatches),
	// 		sumOnArray(stat.placementDistribution, (info) => info.totalMatches),
	// 	);
	const placementTotalMatches = sumOnArray(stat.placementDistribution, (info) => info.totalMatches);
	// debug && console.debug('placementTotalMatches', placementTotalMatches);
	// debug &&
	// 	console.debug(
	// 		'top1',
	// 		sumOnArray(
	// 			stat.placementDistribution.filter((info) => info.rank === 1),
	// 			(info) => info.totalMatches,
	// 		) / placementTotalMatches,
	// 		sumOnArray(
	// 			stat.placementDistribution.filter((info) => info.rank === 1),
	// 			(info) => info.totalMatches,
	// 		),
	// 	);
	return {
		id: stat.cardId,
		heroPowerCardId: getHeroPower(stat.cardId),
		name: allCards.getCard(stat.cardId)?.name,
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
		warbandStats: stat.warbandStats.map((info) => ({
			turn: info.turn,
			totalStats: info.totalStats / info.dataPoints,
		})) as readonly { turn: number; totalStats: number }[],
		combatWinrate: stat.combatWinrate.map((info) => ({
			turn: info.turn,
			winrate: info.totalWinrate / info.dataPoints,
		})) as readonly { turn: number; winrate: number }[],
	} as BgsHeroStat;
};

const buildBgsHeroTier = (averagePosition: number): BgsHeroTier => {
	if (averagePosition < 3.7) {
		return 'S';
	} else if (averagePosition < 4.1) {
		return 'A';
	} else if (averagePosition < 4.4) {
		return 'B';
	} else if (averagePosition < 4.7) {
		return 'C';
	}
	return 'D';
};

const mergeHeroStats = (stats: readonly BgsGlobalHeroStat2[]): BgsGlobalHeroStat2 => {
	// console.debug('merging hero stats', stats);
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
		// console.debug('cwForTurn', cwForTurn, i, stats);
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

const filterType = (stat: GameStat, timeFilter: BgsActiveTimeFilterType, currentBattlegroundsMetaPatch: PatchInfo) => {
	if (!timeFilter) {
		return true;
	}

	switch (timeFilter) {
		case 'last-patch':
			return (
				stat.buildNumber >= currentBattlegroundsMetaPatch.number &&
				stat.creationTimestamp > new Date(currentBattlegroundsMetaPatch.date).getTime()
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

const filterRank = (stat: GameStat, rankFilter: BgsRankFilterType) => {
	if (!rankFilter) {
		return true;
	}

	switch (rankFilter) {
		case 'all':
			return true;
		default:
			return stat.playerRank && parseInt(stat.playerRank) >= parseInt(rankFilter);
	}
};

const isValidMmrDelta = (mmr: number): boolean => {
	return Math.abs(mmr) < 350;
};
