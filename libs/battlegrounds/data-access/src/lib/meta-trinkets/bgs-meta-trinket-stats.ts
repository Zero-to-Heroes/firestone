/* eslint-disable no-mixed-spaces-and-tabs */

import { BgsTrinketStat } from '@firestone-hs/bgs-global-stats';
import { SortCriteria } from '@firestone/shared/common/view';
import { getStandardDeviation, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsMetaTrinketStatTier, BgsMetaTrinketStatTierItem, BgsTrinketTier } from './meta-trinket.model';

export const buildTrinketStats = (
	stats: readonly BgsTrinketStat[],
	allCards: CardsFacadeService,
): readonly BgsMetaTrinketStatTierItem[] => {
	console.debug('building trinket stats', stats);
	const mainStats = stats
		.map((s) => {
			const result: BgsMetaTrinketStatTierItem = {
				cardId: s.trinketCardId,
				name: allCards.getCard(s.trinketCardId).name,
				dataPoints: s.dataPoints,
				averagePlacement: s.averagePlacement,
				averagePlacementTop25: s.averagePlacementAtMmr.find((p) => p.mmr === 25).placement,
				pickRate: s.pickRate,
				pickRateTop25: s.pickRateAtMmr.find((p) => p.mmr === 25).pickRate,
			};
			return result;
		})
		.filter((s) => s.dataPoints > 100);
	return mainStats;
};

export const buildTrinketTiers = (
	stats: readonly BgsMetaTrinketStatTierItem[],
	sort: SortCriteria<ColumnSortType>,
	i18n: ILocalizationService,
	localize = true,
): readonly BgsMetaTrinketStatTier[] => {
	if (!stats?.length) {
		return [];
	}

	const trinketStats = [...stats].sort(sortByProperties((stat) => [getSortProperty(stat, sort)]));
	const { mean, standardDeviation } = getStandardDeviation(trinketStats.map((stat) => getSortProperty(stat, sort)));
	return [
		{
			id: 'S' as BgsTrinketTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterTrinketItems(trinketStats, 0, mean - 3 * standardDeviation),
		},
		{
			id: 'A' as BgsTrinketTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterTrinketItems(trinketStats, mean - 3 * standardDeviation, mean - 1.5 * standardDeviation),
		},
		{
			id: 'B' as BgsTrinketTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterTrinketItems(trinketStats, mean - 1.5 * standardDeviation, mean),
		},
		{
			id: 'C' as BgsTrinketTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterTrinketItems(trinketStats, mean, mean + standardDeviation),
		},
		{
			id: 'D' as BgsTrinketTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterTrinketItems(trinketStats, mean + standardDeviation, mean + 2 * standardDeviation),
		},
		{
			id: 'E' as BgsTrinketTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterTrinketItems(trinketStats, mean + 2 * standardDeviation, null),
		},
	].filter((tier) => tier.items?.length);
};

const getSortProperty = (stat: BgsMetaTrinketStatTierItem, sort: SortCriteria<ColumnSortType>): number => {
	switch (sort.criteria) {
		case 'average-position-high-mmr':
			return stat.averagePlacementTop25;
		case 'pick-rate':
			return -stat.pickRate;
		case 'pick-rate-high-mmr':
			return -stat.pickRateTop25;
		case 'average-position':
		default:
			return stat.averagePlacement;
	}
};

export const filterTrinketItems = (
	stats: readonly BgsMetaTrinketStatTierItem[],
	threshold: number,
	upper: number,
): readonly BgsMetaTrinketStatTierItem[] => {
	return stats
		.filter((stat) => stat.averagePlacement)
		.filter((stat) => stat.averagePlacement >= threshold && (upper === null || stat.averagePlacement < upper));
};

export type ColumnSortType =
	| 'name'
	| 'average-position'
	| 'average-position-high-mmr'
	| 'pick-rate'
	| 'pick-rate-high-mmr';
