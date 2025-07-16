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
	const mainStats = stats.map((s) => {
		const refInfo = strategies.find((strategy) => strategy.compId === s.archetype);
		const result: BgsMetaCompStatTierItem = {
			compId: s.archetype,
			name: i18n.translateString(`bgs-comp.${s.archetype}`),
			dataPoints: s.averagePlacementAtMmr.find((p) => p.mmr === rankFilter)?.dataPoints ?? 0,
			averagePlacement: s.averagePlacementAtMmr.find((p) => p.mmr === rankFilter)?.placement ?? 0,
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
	const { mean, standardDeviation } = getStandardDeviation(compStats.map((stat) => getSortProperty(stat, sort)));
	console.debug('mean', mean, standardDeviation, mean - 1.5 * standardDeviation);
	return [
		{
			id: 'S' as BgsCompTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterCompItems(compStats, sort, -9999999, mean - 3 * standardDeviation),
		},
		{
			id: 'A' as BgsCompTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterCompItems(compStats, sort, mean - 3 * standardDeviation, mean - 1.5 * standardDeviation),
		},
		{
			id: 'B' as BgsCompTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterCompItems(compStats, sort, mean - 1.5 * standardDeviation, mean),
		},
		{
			id: 'C' as BgsCompTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterCompItems(compStats, sort, mean, mean + standardDeviation),
		},
		{
			id: 'D' as BgsCompTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterCompItems(compStats, sort, mean + standardDeviation, mean + 2 * standardDeviation),
		},
		{
			id: 'E' as BgsCompTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterCompItems(compStats, sort, mean + 2 * standardDeviation, null),
		},
	].filter((tier) => tier.items?.length);
};

const getSortProperty = (stat: BgsMetaCompStatTierItem, sort: SortCriteria<ColumnSortTypeComp>): number => {
	switch (sort.criteria) {
		case 'position':
		default:
			return stat.averagePlacement;
	}
};

export const filterCompItems = (
	stats: readonly BgsMetaCompStatTierItem[],
	sort: SortCriteria<ColumnSortTypeComp>,
	threshold: number,
	upper: number | null,
): readonly BgsMetaCompStatTierItem[] => {
	return stats
		.filter((stat) => getSortProperty(stat, sort) != null)
		.filter((stat) => {
			const result =
				getSortProperty(stat, sort) >= threshold && (upper === null || getSortProperty(stat, sort) < upper);
			// console.debug('filtering', stat.name, threshold, upper, result, getSortProperty(stat, sort), stat);
			return result;
		});
};

export type ColumnSortTypeComp = 'position';
