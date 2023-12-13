/* eslint-disable no-mixed-spaces-and-tabs */
import { BgsHeroTier } from '@firestone-hs/bgs-global-stats';
import { WithMmrAndTimePeriod } from '@firestone-hs/bgs-global-stats/dist/quests-v2/charged-stat';
import { BgsGlobalHeroStat, BgsHeroAnomalyStat } from '@firestone-hs/bgs-global-stats/dist/stats-v2/bgs-hero-stat';
import { ALL_BG_RACES, Race, getHeroPower, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { getStandardDeviation, groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { BgsMetaHeroStatTier, BgsMetaHeroStatTierItem } from './meta-heroes.model';

// Remove data that looks corrupted - there is another check elsewhere that flags heroes with not
// enough data points to be reliable
const BGS_HERO_STATS_DATA_POINT_THRESHOLD = 30;

export const enhanceHeroStat = (
	hero: BgsMetaHeroStatTierItem,
	bgGames: readonly GameStat[],
	allCards: CardsFacadeService,
): BgsMetaHeroStatTierItem => {
	const gamesForHero = bgGames.filter(
		(g) =>
			normalizeHeroCardId(g.playerCardId, allCards.getService()) ===
			normalizeHeroCardId(hero.id, allCards.getService()),
	);
	const mmrDeltas = gamesForHero.map((g) => buildNetMmr(g)).filter((mmr) => mmr != null);
	const mmrDeltasPositive = mmrDeltas.filter((d) => d > 0);
	const mmrDeltasNegative = mmrDeltas.filter((d) => d < 0);
	const rawPlayerPlacementDistribution = buildPlayerPlacementDistribution(gamesForHero);
	const totalMatches = rawPlayerPlacementDistribution.map((p) => p.totalMatches).reduce((a, b) => a + b, 0);
	const playerPlacementDistribution: readonly { rank: number; percentage: number }[] =
		rawPlayerPlacementDistribution.map((p) => ({
			rank: p.rank,
			percentage: (100 * p.totalMatches) / totalMatches,
		}));
	return {
		...hero,
		playerDataPoints: gamesForHero.length,
		playerAveragePosition:
			gamesForHero.length === 0
				? null
				: gamesForHero.map((g) => parseInt(g.additionalResult)).reduce((a, b) => a + b, 0) /
				  gamesForHero.length,
		playerNetMmr: mmrDeltas.length === 0 ? null : mmrDeltas.reduce((a, b) => a + b, 0) / mmrDeltas.length,
		playerPlacementDistribution: playerPlacementDistribution,
		playerAverageMmrGain:
			mmrDeltasPositive.length === 0
				? null
				: mmrDeltasPositive.reduce((a, b) => a + b, 0) / mmrDeltasPositive.length,
		playerAverageMmrLoss:
			mmrDeltasNegative.length === 0
				? null
				: mmrDeltasNegative.reduce((a, b) => a + b, 0) / mmrDeltasNegative.length,
		playerLastPlayedTimestamp:
			gamesForHero.length === 0
				? null
				: gamesForHero.sort(sortByProperties((g) => [-g.creationTimestamp]))[0].creationTimestamp,
		playerTop1:
			gamesForHero.length === 0
				? null
				: (100 * gamesForHero.filter((g) => parseInt(g.additionalResult) === 1).length) / gamesForHero.length,
		playerTop4:
			gamesForHero.length === 0
				? null
				: (100 * gamesForHero.filter((g) => parseInt(g.additionalResult) <= 4).length) / gamesForHero.length,
	};
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

const buildNetMmr = (game: GameStat): number => {
	if (!game.playerRank || !game.newPlayerRank) {
		return null;
	}
	return parseInt(game.newPlayerRank) - parseInt(game.playerRank);
};

export const buildTiers = (
	stats: readonly BgsMetaHeroStatTierItem[],
	i18n: ILocalizationService,
	localize = true,
): readonly BgsMetaHeroStatTier[] => {
	console.debug('buildTiers', stats);
	if (!stats?.length) {
		return [];
	}

	const heroStats = [...stats].sort(sortByProperties((s) => [s.averagePosition]));
	console.debug('heroStats', heroStats);
	const { mean, standardDeviation } = getStandardDeviation(heroStats.map((stat) => stat.averagePosition));

	return [
		{
			id: 'S' as BgsHeroTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterItems(heroStats, 0, mean - 3 * standardDeviation),
		},
		{
			id: 'A' as BgsHeroTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterItems(heroStats, mean - 3 * standardDeviation, mean - 1.5 * standardDeviation),
		},
		{
			id: 'B' as BgsHeroTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterItems(heroStats, mean - 1.5 * standardDeviation, mean),
		},
		{
			id: 'C' as BgsHeroTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterItems(heroStats, mean, mean + standardDeviation),
		},
		{
			id: 'D' as BgsHeroTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterItems(heroStats, mean + standardDeviation, mean + 2 * standardDeviation),
		},
		{
			id: 'E' as BgsHeroTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterItems(heroStats, mean + 2 * standardDeviation, 8),
		},
	].filter((tier) => tier.items?.length);
};

export const buildHeroStats = (
	stats: readonly WithMmrAndTimePeriod<BgsGlobalHeroStat>[],
	// mmrPercentile: MmrPercentile['percentile'],
	tribes: readonly Race[],
	anomalies: readonly string[] | null,
	useConservativeEstimate: boolean,
	useMmrFilter: boolean,
	useAnomalyFilter: boolean,
	allCards: CardsFacadeService,
): readonly BgsMetaHeroStatTierItem[] => {
	// mmrPercentile = useMmrFilter ? mmrPercentile : 100;
	anomalies = useAnomalyFilter ? anomalies.filter((a) => !!a) : [];
	// const statsForMmr = stats?.filter((s) => s.mmrPercentile === mmrPercentile) ?? [];
	// Files are split by MMR already
	const statsForMmr = stats ?? [];
	//console.debug('statsForMmr', statsForMmr, mmrPercentile, stats, tribes, anomalies);
	const result1 = statsForMmr.filter((stat) => {
		// If the hero has one big dominant tribe, and the tribes list doesn't include it, filter out
		// that stat
		// We can still have some leftover stats in the data, but that it very likely something bogus
		const overlyDominentTribes = stat.tribeStats
			.filter((t) => t.dataPoints > (4 / 5) * stat.dataPoints)
			// Temporary, because since undeads where omnipresent the stats are skewed
			.filter((t) => t.tribe !== Race.UNDEAD);
		const isIn =
			!overlyDominentTribes.length ||
			!tribes?.length ||
			overlyDominentTribes.every((t) => tribes.includes(t.tribe));
		return isIn;
	});
	return result1
		.map((stat) => {
			const useTribesModifier = !!tribes?.length && tribes.length !== ALL_BG_RACES.length;
			const tribeStatsToUse = useTribesModifier
				? stat.tribeStats
						?.filter((t) => tribes.includes(t.tribe))
						// Remove some incorrect data points
						.filter((t) => t.dataPoints > stat.dataPoints / 20) ?? []
				: stat.tribeStats ?? [];
			if (useTribesModifier && !tribeStatsToUse?.length) {
				console.debug(
					'[debug] [bgs-meta-stats] no tribe stats to use, skipping',
					stat,
					tribes,
					tribeStatsToUse,
				);
				return null;
			}

			const tribesModifier = useTribesModifier
				? tribeStatsToUse?.map((t) => t.impactAveragePosition).reduce((a, b) => a + b, 0) ?? 0
				: 0;
			const tribesAveragePositionModifierDetails = useTribesModifier
				? tribeStatsToUse?.map((t) => ({
						tribe: t.tribe,
						impact: t.impactAveragePosition,
				  }))
				: null;
			// debug && console.debug('tribesModifier', tribesModifier, useTribesModifier, tribeStatsToUse, tribes, stat);

			const useAnomalyModifier = !!anomalies?.length && anomalies.length !== allCards.getAnomalies().length;
			// console.debug('should use anomaly modifier?', useAnomalyModifier, stat.anomalyStats, stat);
			const anomalyStatsToUse = useAnomalyModifier
				? stat.anomalyStats?.filter((t) => anomalies.includes(t.anomaly)) ?? []
				: stat.anomalyStats ?? [];
			if (useAnomalyModifier && !anomalyStatsToUse?.length) {
				console.debug(
					'[debug] [bgs-meta-stats] no anomaly stats to use, skipping',
					stat,
					anomalies,
					anomalyStatsToUse,
				);
				return null;
			}

			const anomalyModifier = useAnomalyModifier
				? anomalyStatsToUse.find((t) => anomalies.includes(t.anomaly))?.impactAveragePosition ?? 0
				: 0;
			const anomaliesAveragePositionModifierDetails = useAnomalyModifier
				? anomalyStatsToUse.map((t) => ({
						cardId: t.anomaly,
						impact: t.impactAveragePosition,
				  }))
				: null;

			const placementDistribution: readonly { rank: number; percentage: number }[] = useAnomalyModifier
				? mergeImpactDistributions(anomalyStatsToUse)
				: stat.placementDistribution;
			const combatWinrate = stat.combatWinrate;
			const warbandStats = stat.warbandStats;

			const averagePositionBaseValue = useConservativeEstimate
				? stat.conservativePositionEstimate
				: stat.averagePosition;
			const dataPoints = Math.min(
				stat.dataPoints,
				useAnomalyModifier
					? anomalyStatsToUse.map((t) => t.dataPoints).reduce((a, b) => a + b, 0)
					: 999_999_999,
				useTribesModifier ? tribeStatsToUse.map((t) => t.dataPoints).reduce((a, b) => a + b, 0) : 999_999_999,
			);
			const result: BgsMetaHeroStatTierItem = {
				id: stat.heroCardId,
				dataPoints: dataPoints,
				averagePosition: averagePositionBaseValue + tribesModifier + anomalyModifier,
				averagePositionDetails: {
					baseValue: averagePositionBaseValue,
					tribesModifiers: tribesAveragePositionModifierDetails,
					anomalyModifiers: anomaliesAveragePositionModifierDetails,
				},
				tribesFilter: tribes,
				anomaliesFilter: anomalies,
				positionTribesModifier: tribesModifier,
				positionAnomalyModifier: anomalyModifier,
				placementDistribution: placementDistribution,
				// placementDistributionImpact: placementDistributionImpactTribes,
				combatWinrate: combatWinrate,
				// combatWinrateImpact: combatWinrateImpactTribes,
				warbandStats: warbandStats,
				// warbandStatsImpact: warbandStatsImpactTribes,

				tribeStats: tribeStatsToUse,

				name: allCards.getCard(stat.heroCardId)?.name,
				baseCardId: normalizeHeroCardId(stat.heroCardId, allCards.getService()),
				heroPowerCardId: getHeroPower(stat.heroCardId, allCards.getService()),
				top1: stat.placementDistribution
					.filter((p) => p.rank === 1)
					.map((p) => p.percentage)
					.reduce((a, b) => a + b, 0),
				top4: stat.placementDistribution
					.filter((p) => p.rank <= 4)
					.map((p) => p.percentage)
					.reduce((a, b) => a + b, 0),
			};
			return result;
		})
		.filter((s) => !!s)
		.filter((stat) => stat.dataPoints >= BGS_HERO_STATS_DATA_POINT_THRESHOLD)
		.sort(sortByProperties((t) => [t.averagePosition]));
};

export const filterItems = (
	stats: readonly BgsMetaHeroStatTierItem[],
	threshold: number,
	upper: number,
): readonly BgsMetaHeroStatTierItem[] => {
	return stats
		.filter((stat) => stat.averagePosition)
		.filter((stat) => stat.averagePosition >= threshold && stat.averagePosition < upper);
};

const mergeImpactDistributions = (
	stats: readonly BgsHeroAnomalyStat[],
): readonly { rank: number; percentage: number }[] => {
	// create an array of ranks from 1 to 8
	const uniqueRanks = [1, 2, 3, 4, 5, 6, 7, 8];

	const result = uniqueRanks.map((rank) => {
		const totalStatsForRank = stats
			.map((s) => (s.placementDistribution.find((t) => t.rank === rank)?.percentage ?? 0) * s.dataPoints)
			.reduce((a, b) => a + b, 0);
		return {
			rank: rank,
			percentage: totalStatsForRank / stats.map((s) => s.dataPoints).reduce((a, b) => a + b, 0),
		};
	});

	return result;
};

const addImpactToPlacementDistribution = (
	placementDistribution: readonly { rank: number; percentage: number }[],
	placementDistributionImpactTribes: readonly { rank: number; percentage: number }[],
	placementDistributionImpactAnomaly: readonly { rank: number; percentage: number }[],
): readonly { rank: number; percentage: number }[] => {
	if (!placementDistributionImpactTribes && !placementDistributionImpactAnomaly) {
		return placementDistribution;
	}
	const result = placementDistribution.map((p) => {
		const impactTribes = placementDistributionImpactTribes?.find((t) => t.rank === p.rank)?.percentage ?? 0;
		const impactAnomaly = placementDistributionImpactAnomaly?.find((t) => t.rank === p.rank)?.percentage ?? 0;
		return {
			rank: p.rank,
			percentage: p.percentage + impactTribes + impactAnomaly,
		};
	});
	return result;
};

const addImpactToCombatWinrate = (
	combatWinrate: readonly { turn: number; winrate: number }[],
	combatWinrateImpactTribes: readonly { turn: number; percentage: number }[],
	combatWinrateImpactAnomaly: readonly { turn: number; percentage: number }[],
): readonly { turn: number; winrate: number }[] => {
	if (!combatWinrateImpactTribes && !combatWinrateImpactAnomaly) {
		return combatWinrate;
	}
	const result = combatWinrate.map((p) => {
		const impactTribes = combatWinrateImpactTribes?.find((t) => t.turn === p.turn)?.percentage ?? 0;
		const impactAnomaly = combatWinrateImpactAnomaly?.find((t) => t.turn === p.turn)?.percentage ?? 0;
		return {
			turn: p.turn,
			winrate: p.winrate + impactTribes + impactAnomaly,
		};
	});
	return result;
};

const addImpactToWarbandStats = (
	warbandStats: readonly { turn: number; averageStats: number }[],
	warbandStatsImpactTribes: readonly { turn: number; averageStats: number }[],
	warbandStatsImpactAnomaly: readonly { turn: number; averageStats: number }[],
): readonly { turn: number; averageStats: number }[] => {
	if (!warbandStatsImpactTribes && !warbandStatsImpactAnomaly) {
		return warbandStats;
	}
	const result = warbandStats.map((p) => {
		const impactTribes = warbandStatsImpactTribes?.find((t) => t.turn === p.turn)?.averageStats ?? 0;
		const impactAnomaly = warbandStatsImpactAnomaly?.find((t) => t.turn === p.turn)?.averageStats ?? 0;
		return {
			turn: p.turn,
			averageStats: p.averageStats + impactTribes + impactAnomaly,
		};
	});
	return result;
};
