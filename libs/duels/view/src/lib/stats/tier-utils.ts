import { getStandardDeviation, sortByProperties } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { DuelsMetaStats, DuelsMetaStatsTier, DuelsMetaStatsTierLevel } from './duels-meta-stats-tier';

export const buildMonoTier = (stats: DuelsMetaStats[]): readonly DuelsMetaStatsTier[] => {
	return [
		{
			id: null,
			label: null,
			tooltip: null,
			items: stats,
		},
	];
};

export const buildTiers = (
	stats: readonly DuelsMetaStats[],
	i18n: ILocalizationService,
	localize = true,
): readonly DuelsMetaStatsTier[] => {
	console.debug('buildTiers', stats);
	if (!stats?.length) {
		return [];
	}

	const sortedStats = [...stats].sort(sortByProperties((s) => [-s.globalWinrate]));
	console.debug('sortedStats', sortedStats);
	const { mean, standardDeviation } = getStandardDeviation(sortedStats.map((stat) => stat.globalWinrate));

	return [
		{
			id: 'S' as DuelsMetaStatsTierLevel,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'S' }) : 'S',
			tooltip: i18n.translateString('app.duels.stats.tier-s-tooltip'),
			items: filterItems(sortedStats, mean + 2 * standardDeviation, 101),
		},
		{
			id: 'A' as DuelsMetaStatsTierLevel,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'A' }) : 'A',
			tooltip: i18n.translateString('app.duels.stats.tier-a-tooltip'),
			items: filterItems(sortedStats, mean + standardDeviation, mean + 2 * standardDeviation),
		},
		{
			id: 'B' as DuelsMetaStatsTierLevel,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'B' }) : 'B',
			tooltip: i18n.translateString('app.duels.stats.tier-b-tooltip'),
			items: filterItems(sortedStats, mean, mean + standardDeviation),
		},
		{
			id: 'C' as DuelsMetaStatsTierLevel,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'C' }) : 'C',
			tooltip: i18n.translateString('app.duels.stats.tier-c-tooltip'),
			items: filterItems(sortedStats, mean - standardDeviation, mean),
		},
		{
			id: 'D' as DuelsMetaStatsTierLevel,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'D' }) : 'D',
			tooltip: i18n.translateString('app.duels.stats.tier-d-tooltip'),
			items: filterItems(sortedStats, mean - 2 * standardDeviation, mean - standardDeviation),
		},
		{
			id: 'E' as DuelsMetaStatsTierLevel,
			label: localize ? i18n.translateString('app.battlegrounds.tier-list.tier', { value: 'E' }) : 'E',
			tooltip: i18n.translateString('app.duels.stats.tier-e-tooltip'),
			items: filterItems(sortedStats, 0, mean - 2 * standardDeviation),
		},
	].filter((tier) => tier.items?.length);
};

const filterItems = (stats: readonly DuelsMetaStats[], threshold: number, upper: number): readonly DuelsMetaStats[] => {
	return stats
		.filter((stat) => stat.globalWinrate)
		.filter((stat) => stat.globalWinrate >= threshold && stat.globalWinrate < upper);
};
