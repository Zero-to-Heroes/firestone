/* eslint-disable no-mixed-spaces-and-tabs */

import { BgsCardStat } from '@firestone-hs/bgs-global-stats';
import { CardType } from '@firestone-hs/reference-data';
import { SortCriteria } from '@firestone/shared/common/view';
import { getStandardDeviation, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsCardTier, BgsMetaCardStatTier, BgsMetaCardStatTierItem } from './meta-card.model';

export const buildCardStats = (
	stats: readonly BgsCardStat[],
	minTurn: number,
	allCards: CardsFacadeService,
): readonly BgsMetaCardStatTierItem[] => {
	console.debug('building card stats', stats);
	const mainStats = stats
		.filter((s) => {
			const ref = allCards.getCard(s.cardId);
			return (
				ref.isBaconPool ||
				(ref.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL] && !!ref.techLevel)
			);
		})
		.map((s) => {
			const relevantStats = s.turnStats.filter((stat) => stat.turn >= minTurn);
			const dataPoints = relevantStats.map((turnStat) => turnStat.totalPlayedAtTurn).reduce((a, b) => a + b, 0);
			const totalPlacement = relevantStats
				.map((turnStat) => turnStat.averagePlacement * turnStat.totalPlayedAtTurn)
				.reduce((a, b) => a + b, 0);
			const averagePlacement = totalPlacement / dataPoints;
			const result: BgsMetaCardStatTierItem = {
				cardId: s.cardId,
				name: allCards.getCard(s.cardId).name,
				dataPoints: dataPoints,
				averagePlacement: averagePlacement,
			};
			return result;
		});
	// .filter((s) => s.dataPoints > 100);
	return mainStats;
};

export const buildCardTiers = (
	stats: readonly BgsMetaCardStatTierItem[],
	sort: SortCriteria<ColumnSortTypeCard>,
	i18n: ILocalizationService,
	localize = true,
): readonly BgsMetaCardStatTier[] => {
	if (!stats?.length) {
		return [];
	}

	const cardStats = [...stats].sort(sortByProperties((stat) => [getSortProperty(stat, sort)]));
	const { mean, standardDeviation } = getStandardDeviation(cardStats.map((stat) => getSortProperty(stat, sort)));
	return [
		{
			id: 'S' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterCardItems(cardStats, 0, mean - 3 * standardDeviation),
		},
		{
			id: 'A' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterCardItems(cardStats, mean - 3 * standardDeviation, mean - 1.5 * standardDeviation),
		},
		{
			id: 'B' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterCardItems(cardStats, mean - 1.5 * standardDeviation, mean),
		},
		{
			id: 'C' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterCardItems(cardStats, mean, mean + standardDeviation),
		},
		{
			id: 'D' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterCardItems(cardStats, mean + standardDeviation, mean + 2 * standardDeviation),
		},
		{
			id: 'E' as BgsCardTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterCardItems(cardStats, mean + 2 * standardDeviation, null),
		},
	].filter((tier) => tier.items?.length);
};

const getSortProperty = (stat: BgsMetaCardStatTierItem, sort: SortCriteria<ColumnSortTypeCard>): number => {
	switch (sort.criteria) {
		// case 'average-position-high-mmr':
		// 	return stat.averagePlacementTop25;
		// case 'pick-rate':
		// 	return -stat.pickRate;
		// case 'pick-rate-high-mmr':
		// 	return -stat.pickRateTop25;
		case 'average-position':
		default:
			return stat.averagePlacement;
	}
};

export const filterCardItems = (
	stats: readonly BgsMetaCardStatTierItem[],
	threshold: number,
	upper: number,
): readonly BgsMetaCardStatTierItem[] => {
	return stats
		.filter((stat) => stat.averagePlacement)
		.filter((stat) => stat.averagePlacement >= threshold && (upper === null || stat.averagePlacement < upper));
};

export type ColumnSortTypeCard =
	| 'name'
	| 'average-position'
	| 'average-position-high-mmr'
	| 'pick-rate'
	| 'pick-rate-high-mmr';
