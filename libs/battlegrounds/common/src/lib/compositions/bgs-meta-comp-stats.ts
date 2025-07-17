/* eslint-disable no-mixed-spaces-and-tabs */

import { BgsCompStat } from '@firestone-hs/bgs-global-stats';
import { BgsCompAdvice, BgsCompCardAdvice } from '@firestone-hs/content-craetor-input';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsRankFilterType } from '@firestone/shared/common/service';
import { SortCriteria } from '@firestone/shared/common/view';
import { getStandardDeviation, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsCompTier, BgsMetaCompCard, BgsMetaCompStatTier, BgsMetaCompStatTierItem } from './meta-comp.model';

export const buildCompStats = (
	stats: readonly BgsCompStat[],
	rankFilter: BgsRankFilterType,
	strategies: readonly BgsCompAdvice[],
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): readonly BgsMetaCompStatTierItem[] => {
	const allStatsFirsts = stats
		.map((s) => {
			const gamesForFirstDistrib =
				s.placementDistributionAtMmr
					.find((p) => p.mmr === rankFilter)
					?.placementDistribution.filter((p) => p.rank <= 4)
					.reduce((a, b) => a + b.totalMatches, 0) ?? 0;
			const firsts =
				s.placementDistributionAtMmr
					.find((p) => p.mmr === rankFilter)
					?.placementDistribution?.find((p) => p.rank === 1)?.totalMatches ?? 0;
			return firsts / gamesForFirstDistrib;
		})
		.reduce((a, b) => a + b, 0);
	const mainStats = stats.map((s) => {
		const refInfo = strategies.find((strategy) => strategy.compId === s.archetype);
		const placementInfo = s.averagePlacementAtMmr.find((p) => p.mmr === rankFilter);
		const distribInfo = s.placementDistributionAtMmr.find((p) => p.mmr === rankFilter);
		const gamesForFirstDistrib =
			s.placementDistributionAtMmr
				.find((p) => p.mmr === rankFilter)
				?.placementDistribution.filter((p) => p.rank <= 4)
				.reduce((a, b) => a + b.totalMatches, 0) ?? 0;
		const firstForStat =
			(distribInfo?.placementDistribution?.find((p) => p.rank === 1)?.totalMatches ?? 0) / gamesForFirstDistrib;
		const firstPercent = firstForStat / allStatsFirsts;
		const result: BgsMetaCompStatTierItem = {
			compId: s.archetype,
			name: i18n.translateString(`bgs-comp.${s.archetype}`),
			dataPoints: placementInfo?.dataPoints ?? 0,
			averagePlacement: placementInfo?.placement ?? 0,
			firstPercent: firstPercent,
			expertRating: refInfo?.powerLevel,
			expertDifficulty: refInfo?.difficulty,
			coreCards: refInfo?.cards.filter((c) => c.status === 'CORE').map((c) => buildCompCard(c, allCards)) ?? [],
			addonCards: refInfo?.cards.filter((c) => c.status === 'ADDON').map((c) => buildCompCard(c, allCards)) ?? [],
		};
		return result;
	});
	return mainStats;
};

const buildCompCard = (card: BgsCompCardAdvice, allCards: CardsFacadeService): BgsMetaCompCard => {
	const refCard = allCards.getCard(card.cardId);
	return {
		cardId: card.cardId,
		entity: Entity.default(refCard),
	};
};

export const buildCompTiers = (
	stats: readonly BgsMetaCompStatTierItem[],
	sort: SortCriteria<ColumnSortTypeComp>,
	i18n: ILocalizationService,
	localize = true,
): readonly BgsMetaCompStatTier[] => {
	if (!stats?.length) {
		return [];
	}

	const compStats = [...stats].sort(sortByProperties((stat) => [getSortProperty(stat, sort)]));
	if (sort.criteria === 'position' || sort.criteria === 'first') {
		// Get the raw values (without sort direction multiplier) for calculating tiers
		const rawValues = compStats.map((stat) => getRawSortProperty(stat, sort.criteria));
		const { mean, standardDeviation } = getStandardDeviation(rawValues);
		console.debug('mean', mean, standardDeviation, mean - 1.5 * standardDeviation);

		// Define tier boundaries based on what constitutes "better" performance
		let tierBoundaries: { lower: number; upper: number | null }[];

		if (sort.criteria === 'position') {
			// For position: lower is better, so S tier has the lowest values
			tierBoundaries = [
				{ lower: -Infinity, upper: mean - 3 * standardDeviation }, // S tier
				{ lower: mean - 3 * standardDeviation, upper: mean - 1.5 * standardDeviation }, // A tier
				{ lower: mean - 1.5 * standardDeviation, upper: mean }, // B tier
				{ lower: mean, upper: mean + standardDeviation }, // C tier
				{ lower: mean + standardDeviation, upper: mean + 2 * standardDeviation }, // D tier
				{ lower: mean + 2 * standardDeviation, upper: null }, // E tier
			];
		} else {
			// For first: higher is better, so S tier has the highest values
			tierBoundaries = [
				{ lower: mean + 3 * standardDeviation, upper: null }, // S tier
				{ lower: mean + 1.5 * standardDeviation, upper: mean + 3 * standardDeviation }, // A tier
				{ lower: mean, upper: mean + 1.5 * standardDeviation }, // B tier
				{ lower: mean - standardDeviation, upper: mean }, // C tier
				{ lower: mean - 2 * standardDeviation, upper: mean - standardDeviation }, // D tier
				{ lower: -Infinity, upper: mean - 2 * standardDeviation }, // E tier
			];
		}

		const tierLabels = ['S', 'A', 'B', 'C', 'D', 'E'];
		const tierTooltips = [
			'app.duels.stats.tier-s-tooltip',
			'app.duels.stats.tier-a-tooltip',
			'app.duels.stats.tier-b-tooltip',
			'app.duels.stats.tier-c-tooltip',
			'app.duels.stats.tier-d-tooltip',
			'app.duels.stats.tier-e-tooltip',
		];

		let tiers = tierBoundaries
			.map((boundary, index) => {
				const tierLabel = tierLabels[index];
				return {
					id: tierLabel as BgsCompTier,
					label: localize
						? i18n.translateString('app.battlegrounds.tier-list.tier', { value: tierLabel })
						: tierLabel,
					tooltip: i18n.translateString(tierTooltips[index]),
					items: filterCompItems(compStats, sort, boundary.lower, boundary.upper),
				};
			})
			.filter((tier) => tier.items?.length);

		// Reverse tier order if sorting in descending direction to show worst performers first
		if (
			(sort.criteria === 'position' && sort.direction === 'desc') ||
			(sort.criteria === 'first' && sort.direction === 'asc')
		) {
			tiers = tiers.reverse();
		}

		return tiers;
	} else {
		return [
			{
				id: null,
				label: null,
				tooltip: null,
				items: compStats,
			},
		];
	}
};

const getSortProperty = (stat: BgsMetaCompStatTierItem, sort: SortCriteria<ColumnSortTypeComp>): number => {
	switch (sort.criteria) {
		case 'position':
			return (sort.direction === 'asc' ? 1 : -1) * stat.averagePlacement;
		case 'expert-rating':
			return (sort.direction === 'asc' ? 1 : -1) * convertRatingToNumber(stat.expertRating);
		case 'expert-difficulty':
			return (sort.direction === 'asc' ? 1 : -1) * convertDifficultyToNumber(stat.expertDifficulty);
		case 'first':
			return (sort.direction === 'asc' ? 1 : -1) * stat.firstPercent;
		default:
			return (sort.direction === 'asc' ? 1 : -1) * stat.averagePlacement;
	}
};

// Helper function to get raw values without sort direction multiplier
const getRawSortProperty = (stat: BgsMetaCompStatTierItem, criteria: ColumnSortTypeComp): number => {
	switch (criteria) {
		case 'position':
			return stat.averagePlacement;
		case 'expert-rating':
			return convertRatingToNumber(stat.expertRating);
		case 'expert-difficulty':
			return convertDifficultyToNumber(stat.expertDifficulty);
		case 'first':
			return stat.firstPercent;
		default:
			return stat.averagePlacement;
	}
};

const convertRatingToNumber = (rating: string | undefined): number => {
	if (!rating) return 0;

	// Convert letter grades to numbers (higher number = better rating for sorting)
	switch (rating.toUpperCase()) {
		case 'S':
			return 5;
		case 'A':
			return 4;
		case 'B':
			return 3;
		case 'C':
			return 2;
		case 'D':
			return 1;
		case 'E':
			return 0;
		default:
			return 0;
	}
};

const convertDifficultyToNumber = (difficulty: string | undefined): number => {
	if (!difficulty) return 0;

	// Convert difficulty levels to numbers (higher number = more difficult)
	switch (difficulty.toLowerCase()) {
		case 'easy':
			return 1;
		case 'medium':
			return 2;
		case 'hard':
			return 3;
		default:
			return 0;
	}
};

export const filterCompItems = (
	stats: readonly BgsMetaCompStatTierItem[],
	sort: SortCriteria<ColumnSortTypeComp>,
	threshold: number,
	upper: number | null,
): readonly BgsMetaCompStatTierItem[] => {
	// Use raw values for tier boundary comparisons
	const filteredStats = stats
		.filter((stat) => getRawSortProperty(stat, sort.criteria) != null)
		.filter((stat) => {
			const rawValue = getRawSortProperty(stat, sort.criteria);

			// Handle threshold (lower bound)
			const passesLowerBound = threshold === -Infinity || rawValue >= threshold;

			// Handle upper bound
			const passesUpperBound = upper === null || rawValue < upper;

			const result = passesLowerBound && passesUpperBound;
			// console.debug('filtering', stat.name, threshold, upper, result, rawValue, stat);
			return result;
		});

	// The stats are already sorted according to the sort criteria and direction
	// so we just return the filtered results maintaining their order
	return filteredStats;
};

export type ColumnSortTypeComp = 'position' | 'expert-rating' | 'expert-difficulty' | 'first';
