import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { WithMmrAndTimePeriod } from '@firestone-hs/bgs-global-stats/dist/quests-v2/charged-stat';
import { BgsGlobalHeroStat } from '@firestone-hs/bgs-global-stats/dist/stats-v2/bgs-hero-stat';
import { ALL_BG_RACES, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { LocalizationFacadeService } from '../localization-facade.service';
import { getStandardDeviation, sortByProperties } from '../utils';
import { normalizeHeroCardId } from './bgs-utils';

export const enhanceHeroStat = (
	hero: BgsMetaHeroStatTierItem,
	bgGames: readonly GameStat[],
	allCards: CardsFacadeService,
): BgsMetaHeroStatTierItem => {
	const gamesForHero = bgGames.filter(
		(g) => normalizeHeroCardId(g.playerCardId, allCards) === normalizeHeroCardId(hero.heroCardId, allCards),
	);
	const mmrDeltas = gamesForHero.map((g) => buildNetMmr(g)).filter((mmr) => mmr != null);
	return {
		...hero,
		playerDataPoints: gamesForHero.length,
		playerAveragePosition:
			gamesForHero.length === 0
				? null
				: gamesForHero.map((g) => parseInt(g.additionalResult)).reduce((a, b) => a + b, 0) /
				  gamesForHero.length,
		playerNetMmr: mmrDeltas.length === 0 ? null : mmrDeltas.reduce((a, b) => a + b, 0) / mmrDeltas.length,
		playerLastPlayedTimestamp:
			gamesForHero.length === 0
				? null
				: gamesForHero.sort(sortByProperties((g) => [-g.creationTimestamp]))[0].creationTimestamp,
	};
};

const buildNetMmr = (game: GameStat): number => {
	if (!game.playerRank || !game.newPlayerRank) {
		return null;
	}
	return parseInt(game.newPlayerRank) - parseInt(game.playerRank);
};

export const buildTiers = (
	heroStats: readonly BgsMetaHeroStatTierItem[],
	i18n: LocalizationFacadeService,
): readonly BgsMetaHeroStatTier[] => {
	if (!heroStats?.length) {
		return [];
	}

	const { mean, standardDeviation } = getStandardDeviation(heroStats.map((stat) => stat.averagePosition));

	return [
		{
			label: i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }),
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterItems(heroStats, 0, mean - 3 * standardDeviation),
		},
		{
			label: i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }),
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterItems(heroStats, mean - 3 * standardDeviation, mean - 1.5 * standardDeviation),
		},
		{
			label: i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }),
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterItems(heroStats, mean - 1.5 * standardDeviation, mean),
		},
		{
			label: i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }),
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterItems(heroStats, mean, mean + standardDeviation),
		},
		{
			label: i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }),
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterItems(heroStats, mean + standardDeviation, mean + 2 * standardDeviation),
		},
		{
			label: i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }),
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterItems(heroStats, mean + 2 * standardDeviation, 8),
		},
	].filter((tier) => tier.items?.length);
};

export const buildHeroStats = (
	stats: readonly WithMmrAndTimePeriod<BgsGlobalHeroStat>[],
	mmrPercentile: MmrPercentile['percentile'],
	tribes: readonly Race[],
): readonly BgsMetaHeroStatTierItem[] => {
	const statsForMmr = stats.filter((s) => s.mmrPercentile === mmrPercentile);
	return statsForMmr
		.filter((stat) => {
			// If the hero has one big dominant tribe, and the tribes list doesn't include it, filter out
			// that stat
			// We can still have some leftover stats in the data, but that it very likely something bogus
			const overlyDominentTribes = stat.tribeStats.filter((t) => t.dataPoints > stat.dataPoints / 2);
			return (
				!overlyDominentTribes.length ||
				!tribes?.length ||
				overlyDominentTribes.every((t) => tribes.includes(t.tribe))
			);
		})
		.map((stat) => {
			const useTribesModifier = !!tribes?.length && tribes.length !== ALL_BG_RACES.length;
			const tribeStatsToUse = useTribesModifier
				? stat.tribeStats
						.filter((t) => tribes.includes(t.tribe))
						// Remove some incorrect data points
						.filter((t) => t.dataPoints > stat.dataPoints / 20)
				: [];

			const tribesModifier = useTribesModifier
				? 0
				: tribeStatsToUse.map((t) => t.impactAveragePosition).reduce((a, b) => a + b, 0);

			let placementDistribution = stat.placementDistribution;
			let placementDistributionImpact = null;
			let combatWinrate = stat.combatWinrate;
			let combatWinrateImpact = null;
			if (useTribesModifier) {
				placementDistributionImpact = stat.placementDistribution.map((p) => {
					const rankImpact = tribeStatsToUse
						.flatMap((t) => t.impactPlacementDistribution)
						.filter((t) => t.rank === p.rank)
						.map((t) => t.impact)
						.reduce((a, b) => a + b, 0);
					return {
						rank: p.rank,
						percentage: rankImpact,
					};
				});
				placementDistribution = stat.placementDistribution.map((p) => {
					return {
						rank: p.rank,
						percentage:
							p.percentage + placementDistributionImpact.find((t) => t.rank === p.rank).percentage,
					};
				});

				combatWinrateImpact = stat.combatWinrate.map((p) => {
					const turnImpact = tribeStatsToUse
						.flatMap((t) => t.impactCombatWinrate)
						.filter((t) => t.turn === p.turn)
						.map((t) => t.impact)
						.reduce((a, b) => a + b, 0);
					return {
						turn: p.turn,
						percentage: turnImpact,
					};
				});
				combatWinrate = stat.combatWinrate.map((p) => {
					return {
						turn: p.turn,
						winrate: p.winrate + combatWinrateImpact.find((t) => t.turn === p.turn).winrate,
					};
				});
			}

			const result: BgsMetaHeroStatTierItem = {
				heroCardId: stat.heroCardId,
				dataPoints: stat.dataPoints,
				averagePosition: stat.averagePosition + tribesModifier,
				positionTribesModifier: tribesModifier,
				placementDistribution: placementDistribution,
				placementDistributionImpact: placementDistributionImpact,
				combatWinrate: combatWinrate,
				combatWinrateImpact: combatWinrateImpact,
			};
			return result;
		})
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

export interface BgsMetaHeroStatTier {
	readonly label: string;
	readonly tooltip: string;
	readonly items: readonly BgsMetaHeroStatTierItem[];
}

export interface BgsMetaHeroStatTierItem {
	readonly heroCardId: string;
	readonly dataPoints: number;
	readonly playerDataPoints?: number;
	readonly averagePosition: number;
	readonly playerAveragePosition?: number;
	readonly positionTribesModifier: number;
	readonly placementDistribution: readonly { rank: number; percentage: number }[];
	readonly placementDistributionImpact: readonly { rank: number; percentage: number }[];
	readonly combatWinrate: readonly { turn: number; winrate: number }[];
	readonly combatWinrateImpact: readonly { turn: number; winrate: number }[];
	readonly playerNetMmr?: number;
	readonly playerLastPlayedTimestamp?: number;
}
