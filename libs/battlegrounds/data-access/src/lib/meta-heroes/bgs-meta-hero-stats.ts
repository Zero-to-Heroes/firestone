/* eslint-disable no-mixed-spaces-and-tabs */
import { BgsGlobalHeroStat, WithMmrAndTimePeriod } from '@firestone-hs/bgs-global-stats';
import { ALL_BG_RACES, Race, getHeroPower, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { getStandardDeviation, groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { BgsHeroTier, BgsMetaHeroStatTier, BgsMetaHeroStatTierItem } from './meta-heroes.model';

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
	if (!game.playerRank || !game.newPlayerRank || +game.newPlayerRank < 0) {
		return null;
	}
	return parseInt(game.newPlayerRank) - parseInt(game.playerRank);
};

export const buildTiers = (
	stats: readonly BgsMetaHeroStatTierItem[],
	i18n: ILocalizationService,
	localize = true,
): readonly BgsMetaHeroStatTier[] => {
	if (!stats?.length) {
		return [];
	}

	const heroStats = [...stats].sort(sortByProperties((s) => [s.averagePosition]));
	const { mean, standardDeviation } = getStandardDeviation(heroStats.map((stat) => stat.averagePosition));
	console.debug('[debug]', i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }), i18n);

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
	tribes: readonly Race[],
	useConservativeEstimate: boolean,
	allCards: CardsFacadeService,
	useDebug = false,
): readonly BgsMetaHeroStatTierItem[] => {
	// Files are split by MMR already
	const statsForMmr = stats ?? [];
	const result1 = statsForMmr.filter((stat) => {
		// If the hero has one big dominant tribe, and the tribes list doesn't include it, filter out
		// that stat
		// We can still have some leftover stats in the data, but that it very likely something bogus
		const overlyDominentTribes = stat.tribeStats.filter((t) => t.dataPoints > (4 / 5) * stat.dataPoints);
		const isIn =
			!overlyDominentTribes.length ||
			!tribes?.length ||
			overlyDominentTribes.every((t) => tribes.includes(t.tribe));
		return isIn;
	});
	return result1
		.map((stat) => {
			const shouldDebug = useDebug && stat.heroCardId === 'BG24_HERO_100';
			const useTribesModifier = !!tribes?.length && tribes.length !== ALL_BG_RACES.length;
			const modifiedTribeStats = (stat.tribeStats ?? [])
				// Remove some incorrect data points
				.filter((t) => t.dataPoints > stat.dataPoints / 20)
				.filter((t) => t.dataPointsOnMissingTribe > t.dataPoints / 20)
				.map((t) => ({
					...t,
					// Use t.averagePosition - t.refAveragePosition to limit the sample size issue with missing tribes
					// UPdate: since we now restrict to top 10% for overlay stats, we can use the vs missing tribe to
					// spread out the impacts more
					impactAveragePosition: t.impactAveragePositionVsMissingTribe,
				}));
			const tribeStatsToUse = useTribesModifier
				? modifiedTribeStats.filter((t) => tribes.includes(t.tribe))
				: modifiedTribeStats;
			shouldDebug && console.debug('[bgs-2] tribeStatsToUse', tribeStatsToUse, tribes, stat);

			if (useTribesModifier && !tribeStatsToUse?.length) {
				return null;
			}

			const tribesModifier = useTribesModifier
				? (tribeStatsToUse?.map((t) => t.impactAveragePosition).reduce((a, b) => a + b, 0) ?? 0)
				: 0;
			const tribesAveragePositionModifierDetails = useTribesModifier
				? tribeStatsToUse?.map((t) => ({
						tribe: t.tribe,
						impact: t.impactAveragePosition,
					}))
				: null;
			const allTribesAveragePositionModifierDetails = modifiedTribeStats.map((t) => ({
				tribe: t.tribe,
				impact: t.impactAveragePosition,
			}));
			shouldDebug &&
				console.debug('[bgs-2] tribeStatsToUse', tribeStatsToUse, tribesAveragePositionModifierDetails);

			const placementDistribution: readonly { rank: number; percentage: number }[] = stat.placementDistribution;
			const combatWinrate = stat.combatWinrate;
			const warbandStats = stat.warbandStats;

			const averagePositionBaseValue = useConservativeEstimate
				? stat.conservativePositionEstimate
				: stat.averagePosition;
			shouldDebug &&
				console.debug(
					'[bgs-2] averagePositionBaseValue',
					averagePositionBaseValue,
					useConservativeEstimate,
					stat,
				);
			const dataPoints = Math.min(
				stat.dataPoints,
				useTribesModifier ? tribeStatsToUse.map((t) => t.dataPoints).reduce((a, b) => a + b, 0) : 999_999_999,
			);
			const pickrate = stat.totalOffered ? stat.totalPicked / stat.totalOffered : null;
			const result: BgsMetaHeroStatTierItem = {
				id: stat.heroCardId,
				dataPoints: dataPoints,
				averagePosition: averagePositionBaseValue + tribesModifier,
				averagePositionDetails: {
					baseValue: averagePositionBaseValue,
					tribesModifiers: tribesAveragePositionModifierDetails,
					allTribesAveragePositionModifierDetails: allTribesAveragePositionModifierDetails,
				},
				pickrate: pickrate,
				tribesFilter: tribes,
				positionTribesModifier: tribesModifier,
				placementDistribution: placementDistribution,
				combatWinrate: combatWinrate,
				warbandStats: warbandStats,

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
