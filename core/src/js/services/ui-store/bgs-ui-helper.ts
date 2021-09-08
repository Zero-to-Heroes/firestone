import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BgsActiveTimeFilterType } from '../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from '../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../models/patches';
import { getHeroPower, normalizeHeroCardId } from '../battlegrounds/bgs-utils';
import { CardsFacadeService } from '../cards-facade.service';
import { cutNumber } from '../utils';

export const filterBgsMatchStats = (
	bgsMatchStats: readonly GameStat[],
	timeFilter: BgsActiveTimeFilterType,
	rankFilter: BgsRankFilterType,
	currentBattlegroundsMetaPatch: PatchInfo,
): readonly GameStat[] => {
	return bgsMatchStats
		.filter((stat) => filterType(stat, timeFilter, currentBattlegroundsMetaPatch))
		.filter((stat) => filterRank(stat, rankFilter));
};

export const buildHeroStats = (
	globalStats: BgsStats,
	bgsStatsForCurrentPatch: readonly GameStat[],
	cards: CardsFacadeService,
	heroSortFilter: BgsHeroSortFilterType,
) => {
	const heroStats =
		globalStats?.heroStats?.map((heroStat) => {
			const playerGamesPlayed =
				heroStat.id === 'average'
					? []
					: bgsStatsForCurrentPatch.filter(
							(stat) =>
								normalizeHeroCardId(stat.playerCardId, true, cards) ===
								normalizeHeroCardId(heroStat.id, true, cards),
					  );
			const totalPlayerGamesPlayed = playerGamesPlayed.length;
			const playerPopularity = (100 * totalPlayerGamesPlayed) / bgsStatsForCurrentPatch.length;
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
			return BgsHeroStat.create({
				...heroStat,
				top4: heroStat.top4 || 0,
				top1: heroStat.top1 || 0,
				name: heroStat.id !== 'average' ? cards.getCard(heroStat.id)?.name : heroStat.id,
				heroPowerCardId: getHeroPower(heroStat.id),
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
		}) ||
		[] ||
		[];
	return heroStats.sort(buildSortingFunction(heroSortFilter));
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
		case 'past-30':
			return Date.now() - stat.creationTimestamp <= 30 * 24 * 60 * 60 * 1000;
		case 'past-7':
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
