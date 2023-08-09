/* eslint-disable no-mixed-spaces-and-tabs */
import { BgsGlobalQuestStat, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { WithMmrAndTimePeriod } from '@firestone-hs/bgs-global-stats/dist/quests-v2/charged-stat';
import { getStandardDeviation, sortByProperties } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { BgsMetaQuestStatTier, BgsMetaQuestStatTierItem, BgsQuestTier } from './meta-quests.model';

export const buildQuestStats = (
	stats: readonly WithMmrAndTimePeriod<BgsGlobalQuestStat>[],
	mmrFilter: MmrPercentile['percentile'],
): readonly BgsMetaQuestStatTierItem[] => {
	return stats
		.filter((s) => s.mmrPercentile === mmrFilter)
		.map((s) => ({
			cardId: s.questCardId,
			dataPoints: s.dataPoints,
			averageTurnsToComplete: s.averageTurnToComplete,
		}));
};

export const buildQuestTiers = (
	stats: readonly BgsMetaQuestStatTierItem[],
	i18n: ILocalizationService,
	localize = true,
): readonly BgsMetaQuestStatTier[] => {
	console.debug('buildTiers', stats);
	if (!stats?.length) {
		return [];
	}

	const questStats = [...stats].sort(sortByProperties((s) => [s.averageTurnsToComplete]));
	console.debug('questStats', questStats);
	const { mean, standardDeviation } = getStandardDeviation(questStats.map((stat) => stat.averageTurnsToComplete));

	// TODO: How to include the difficulty?
	return [
		{
			id: 'S' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterQuestItems(questStats, 0, mean - 3 * standardDeviation),
		},
		{
			id: 'A' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterQuestItems(questStats, mean - 3 * standardDeviation, mean - 1.5 * standardDeviation),
		},
		{
			id: 'B' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterQuestItems(questStats, mean - 1.5 * standardDeviation, mean),
		},
		{
			id: 'C' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterQuestItems(questStats, mean, mean + standardDeviation),
		},
		{
			id: 'D' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterQuestItems(questStats, mean + standardDeviation, mean + 2 * standardDeviation),
		},
		{
			id: 'E' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterQuestItems(questStats, mean + 2 * standardDeviation, 8),
		},
	].filter((tier) => tier.items?.length);
};

export const filterQuestItems = (
	stats: readonly BgsMetaQuestStatTierItem[],
	threshold: number,
	upper: number,
): readonly BgsMetaQuestStatTierItem[] => {
	return stats
		.filter((stat) => stat.averageTurnsToComplete)
		.filter((stat) => stat.averageTurnsToComplete >= threshold && stat.averageTurnsToComplete < upper);
};
