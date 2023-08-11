/* eslint-disable no-mixed-spaces-and-tabs */
import { BgsGlobalRewardStat, MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { WithMmrAndTimePeriod } from '@firestone-hs/bgs-global-stats/dist/quests-v2/charged-stat';
import { getStandardDeviation, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsMetaQuestRewardStatTier, BgsMetaQuestRewardStatTierItem, BgsQuestTier } from './meta-quests.model';

const QUEST_REWARDS_MINIMUM_DATA_POINTS = 1000;

export const buildQuestRewardStats = (
	stats: readonly WithMmrAndTimePeriod<BgsGlobalRewardStat>[],
	mmrFilter: MmrPercentile['percentile'],
	allCards: CardsFacadeService,
): readonly BgsMetaQuestRewardStatTierItem[] => {
	const mainStats: readonly BgsMetaQuestRewardStatTierItem[] = stats
		.filter((s) => s.mmrPercentile === mmrFilter)
		.filter((s) => s.dataPoints > QUEST_REWARDS_MINIMUM_DATA_POINTS)
		.map((s) => ({
			cardId: s.rewardCardId,
			name: allCards.getCard(s.rewardCardId).name,
			dataPoints: s.dataPoints,
			averagePosition: s.averagePlacement,
		}));
	return mainStats;
};

export const buildQuestRewardTiers = (
	stats: readonly BgsMetaQuestRewardStatTierItem[],
	searchString: string,
	i18n: ILocalizationService,
	localize = true,
): readonly BgsMetaQuestRewardStatTier[] => {
	console.debug('buildTiers', stats);
	if (!stats?.length) {
		return [];
	}

	const questStats = [...stats].sort(sortByProperties((s) => [s.averagePosition]));
	console.debug('questStats', questStats);
	const { mean, standardDeviation } = getStandardDeviation(questStats.map((stat) => stat.averagePosition));

	// TODO: How to include the difficulty?
	return [
		{
			id: 'S' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterQuestRewardItems(questStats, 0, mean - 3 * standardDeviation, searchString),
		},
		{
			id: 'A' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterQuestRewardItems(
				questStats,
				mean - 3 * standardDeviation,
				mean - 1.5 * standardDeviation,
				searchString,
			),
		},
		{
			id: 'B' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterQuestRewardItems(questStats, mean - 1.5 * standardDeviation, mean, searchString),
		},
		{
			id: 'C' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterQuestRewardItems(questStats, mean, mean + standardDeviation, searchString),
		},
		{
			id: 'D' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterQuestRewardItems(
				questStats,
				mean + standardDeviation,
				mean + 2 * standardDeviation,
				searchString,
			),
		},
		{
			id: 'E' as BgsQuestTier,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterQuestRewardItems(questStats, mean + 2 * standardDeviation, null, searchString),
		},
	].filter((tier) => tier.items?.length);
};

export const filterQuestRewardItems = (
	stats: readonly BgsMetaQuestRewardStatTierItem[],
	threshold: number,
	upper: number,
	searchString: string,
): readonly BgsMetaQuestRewardStatTierItem[] => {
	return stats
		.filter((stat) => !searchString?.length || stat.name.toLowerCase().includes(searchString.toLowerCase()))
		.filter((stat) => stat.averagePosition)
		.filter((stat) => stat.averagePosition >= threshold && (upper === null || stat.averagePosition < upper));
};
