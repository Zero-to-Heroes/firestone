/* eslint-disable no-mixed-spaces-and-tabs */

import { BgsCardStat } from '@firestone-hs/bgs-global-stats';
import { SortCriteria } from '@firestone/shared/common/view';
import { getStandardDeviation, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsCardTier, BgsMetaCardStatTier, BgsMetaCardStatTierItem } from './meta-card.model';
import { ALL_BG_RACES, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { isBgsTimewarped } from '../card-utils';

export const buildCardStats = (
	stats: readonly BgsCardStat[],
	tribesFilter: readonly Race[],
	minTurn: number,
	exactTurn: number | null,
	allCards: CardsFacadeService,
): readonly BgsMetaCardStatTierItem[] => {
	console.debug('building card stats', stats);
	const mainStats = stats
		.filter((s) => {
			const ref = allCards.getCard(s.cardId);
			return (
				(ref.isBaconPool || isBgsTimewarped(ref)) &&
				(!tribesFilter?.length ||
					tribesFilter.some((r) => ref.races?.includes(Race[r]) || (r === Race.BLANK && !ref.races?.length)))
			);
		})
		.map((s) => {
			const relevantStats = s.turnStats.filter((stat) =>
				exactTurn == null ? stat.turn >= minTurn : stat.turn === exactTurn,
			);
			const dataPoints = relevantStats.map((turnStat) => turnStat.totalPlayed).reduce((a, b) => a + b, 0);
			const totalPlacement = relevantStats
				.map((turnStat) => turnStat.averagePlacement * turnStat.totalPlayed)
				.reduce((a, b) => a + b, 0);
			const averagePlacement = totalPlacement / dataPoints;
			const totalPlacementOther = relevantStats
				.map((turnStat) => turnStat.averagePlacementOther * turnStat.totalPlayed)
				.reduce((a, b) => a + b, 0);
			const averagePlacementOther = totalPlacementOther / dataPoints;
			const impact = averagePlacement - averagePlacementOther;
			const result: BgsMetaCardStatTierItem = {
				cardId: s.cardId,
				name: allCards.getCard(s.cardId).name,
				dataPoints: dataPoints,
				averagePlacement: exactTurn == null ? null : averagePlacement,
				impact: exactTurn == null ? null : impact,
			};
			return result;
		});
	console.debug('[debug] mainStats', mainStats);
	// .filter((s) => s.dataPoints > 100);
	return mainStats;
};

export const buildCardTiers = (
	stats: readonly BgsMetaCardStatTierItem[],
	sort: SortCriteria<ColumnSortTypeCard>,
	tribesFilter: readonly Race[],
	i18n: ILocalizationService,
	allCards: CardsFacadeService,
	localize = true,
): readonly BgsMetaCardStatTier[] => {
	if (!stats?.length) {
		return [];
	}

	if (sort.criteria === 'card-details') {
		return buildCardsGroupedByTavernTier(stats, sort, tribesFilter, allCards, i18n).filter((tier) =>
			tier.sections.some((s) => s.items.length > 0),
		);
	}

	const cardStats = [...stats].sort(sortByProperties((stat) => [getSortProperty(stat, sort)]));
	const { mean, standardDeviation } = getStandardDeviation(cardStats.map((stat) => getSortProperty(stat, sort)));
	console.debug('mean', mean, standardDeviation, mean - 1.5 * standardDeviation);
	return [
		{
			id: 'S' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			sections: [
				{
					label: null,
					items: filterCardItems(cardStats, sort, -9999999, mean - 3 * standardDeviation),
				},
			],
		},
		{
			id: 'A' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			sections: [
				{
					label: null,
					items: filterCardItems(
						cardStats,
						sort,
						mean - 3 * standardDeviation,
						mean - 1.5 * standardDeviation,
					),
				},
			],
		},
		{
			id: 'B' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			sections: [
				{
					label: null,
					items: filterCardItems(cardStats, sort, mean - 1.5 * standardDeviation, mean),
				},
			],
		},
		{
			id: 'C' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			sections: [
				{
					label: null,
					items: filterCardItems(cardStats, sort, mean, mean + standardDeviation),
				},
			],
		},
		{
			id: 'D' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			sections: [
				{
					label: null,
					items: filterCardItems(cardStats, sort, mean + standardDeviation, mean + 2 * standardDeviation),
				},
			],
		},
		{
			id: 'E' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			sections: [
				{
					label: null,
					items: filterCardItems(cardStats, sort, mean + 2 * standardDeviation, null),
				},
			],
		},
	].filter((tier) => tier.sections.some((s) => s.items.length > 0));
};

const getSortProperty = (stat: BgsMetaCardStatTierItem, sort: SortCriteria<ColumnSortTypeCard>): number => {
	switch (sort.criteria) {
		// case 'average-position-high-mmr':
		// 	return stat.averagePlacementTop25;
		// case 'pick-rate':
		// 	return -stat.pickRate;
		// case 'pick-rate-high-mmr':
		// 	return -stat.pickRateTop25;
		case 'impact':
			return stat.impact;
		case 'average-position':
		default:
			return stat.averagePlacement;
	}
};

const buildCardsGroupedByTavernTier = (
	stats: readonly BgsMetaCardStatTierItem[],
	sort: SortCriteria<ColumnSortTypeCard>,
	tribesFilter: readonly Race[],
	allCards: CardsFacadeService,
	i18n: ILocalizationService,
): readonly BgsMetaCardStatTier[] => {
	// Tiers go from 1 to 7
	const tiers = Array.from({ length: 7 }, (_, index) => index + 1);
	return tiers.map((tier) => {
		const cardsForTier = stats
			.filter((s) => allCards.getCard(s.cardId).techLevel === tier)
			.sort(sortByProperties((stat) => [stat.name]));
		const sections = (tribesFilter.length ? tribesFilter : [...ALL_BG_RACES, Race.BLANK])
			.map((race) => {
				return {
					label: i18n.translateString(`global.tribe.${Race[race].toLowerCase()}`),
					items: cardsForTier.filter(
						(s) =>
							allCards.getCard(s.cardId).races?.includes(Race[race]) ||
							(race === Race.ALL && !!allCards.getCard(s.cardId).races?.length) ||
							(race === Race.BLANK && !allCards.getCard(s.cardId).races?.length),
					),
				};
			})
			.filter((s) => s.items.length > 0)
			.sort((a, b) => a.label.localeCompare(b.label));
		return {
			id: tier as any,
			label: i18n.translateString('app.battlegrounds.tier-list.tavern-tier', { value: tier.toString() }),
			tooltip: i18n.translateString('app.duels.stats.tier-tooltip', { value: tier.toString() }),
			sections: sections,
		};
	});
};

export const filterCardItems = (
	stats: readonly BgsMetaCardStatTierItem[],
	sort: SortCriteria<ColumnSortTypeCard>,
	threshold: number,
	upper: number,
): readonly BgsMetaCardStatTierItem[] => {
	return stats
		.filter((stat) => getSortProperty(stat, sort) != null)
		.filter((stat) => {
			const result =
				getSortProperty(stat, sort) >= threshold && (upper === null || getSortProperty(stat, sort) < upper);
			// console.debug('filtering', stat.name, threshold, upper, result, getSortProperty(stat, sort), stat);
			return result;
		});
};

export type ColumnSortTypeCard =
	| 'card-details'
	| 'impact'
	| 'average-position'
	| 'average-position-high-mmr'
	| 'pick-rate'
	| 'pick-rate-high-mmr';
