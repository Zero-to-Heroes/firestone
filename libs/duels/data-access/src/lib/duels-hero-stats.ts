import { DuelsHeroStat, DuelsTreasureStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { duelsTreasureRank, isPassive, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import {
	DuelsCombinedHeroStat,
	DuelsHeroFilterType,
	DuelsStatTypeFilterType,
	DuelsTreasureStatTypeFilterType,
} from './duels-meta-heroes.model';

export const buildDuelsCombinedHeroStats = (
	duelStats: readonly DuelsHeroStat[],
	statType: DuelsStatTypeFilterType,
): DuelsCombinedHeroStat[] => {
	const totalRuns = duelStats.map((stat) => stat.totalRuns).reduce((a, b) => a + b, 0);

	const grouped: { [cardId: string]: readonly DuelsHeroStat[] } = groupByFunction(
		getGroupingKeyForHeroStat(statType),
	)(duelStats);

	return Object.keys(grouped).map((key) => {
		const group = grouped[key];
		const totalRunsForGroup = group.map((g) => g.totalRuns).reduce((a, b) => a + b, 0);
		const totalMatchesForGroup = group.map((g) => g.totalMatches).reduce((a, b) => a + b, 0);
		const winsDistribution: { winNumber: number; value: number }[] = [];
		for (let i = 0; i <= 12; i++) {
			const totalWinsForNumber = group.map((g) => g.winDistribution[i]).reduce((a, b) => a + b, 0);
			winsDistribution.push({ winNumber: i, value: (100 * totalWinsForNumber) / totalRunsForGroup });
		}
		return {
			hero: group[0].hero,
			heroPower: group[0].heroPowerCardId,
			signatureTreasure: group[0].signatureTreasureCardId,
			periodStart: null,
			cardId: key,
			globalPopularity: (100 * totalRunsForGroup) / totalRuns,
			// TODO: rename this to totalRuns
			globalTotalMatches: totalRunsForGroup,
			globalWinrate: (100 * group.map((g) => g.totalWins).reduce((a, b) => a + b, 0)) / totalMatchesForGroup,
			globalWinDistribution: winsDistribution as readonly { winNumber: number; value: number }[],
		} as DuelsCombinedHeroStat;
	});
};

export const filterDuelsHeroStats = (
	heroStats: readonly DuelsHeroStat[] | null,
	heroesFilter: DuelsHeroFilterType,
	heroPowerFilter: 'all' | string,
	signatureTreasureFilter: 'all' | string,
	// timeFilter: DuelsTimeFilterType, // The stats fed in input are already filtered (we only download the ones for a specific time period)
	statType: DuelsStatTypeFilterType,
	allCards: CardsFacadeService,
	searchString: string | null = null,
): readonly DuelsHeroStat[] => {
	console.debug(
		'filtering hero stats',
		(heroStats ?? [])
			.filter((stat) =>
				!heroesFilter?.length
					? false
					: heroesFilter.some((heroFilter) => normalizeDuelsHeroCardId(stat.hero) === heroFilter),
			)
			.filter((stat) =>
				// Don't consider the hero power filter when filtering heroes, as there is always only one hero for
				// a given hero power (so we only have one result at the end, which isn't really useful for comparison)
				heroPowerFilter === 'all' || statType !== 'signature-treasure'
					? true
					: stat.heroPowerCardId === heroPowerFilter,
			)
			.filter((stat) =>
				// Similar
				signatureTreasureFilter === 'all' || statType !== 'hero-power'
					? true
					: stat.signatureTreasureCardId === signatureTreasureFilter,
			),
		heroesFilter,
		heroPowerFilter,
		statType,
		signatureTreasureFilter,
	);
	const result = (heroStats ?? [])
		.filter((stat) =>
			!heroesFilter?.length
				? false
				: heroesFilter.some((heroFilter) => normalizeDuelsHeroCardId(stat.hero) === heroFilter),
		)
		.filter((stat) =>
			// Don't consider the hero power filter when filtering heroes, as there is always only one hero for
			// a given hero power (so we only have one result at the end, which isn't really useful for comparison)
			heroPowerFilter === 'all' || statType !== 'signature-treasure'
				? true
				: stat.heroPowerCardId === heroPowerFilter,
		)
		.filter((stat) =>
			// Similar
			signatureTreasureFilter === 'all' || statType !== 'hero-power'
				? true
				: stat.signatureTreasureCardId === signatureTreasureFilter,
		)
		// TODO: update for Vanndar
		.filter((stat) => {
			if (!searchString?.length) {
				return true;
			}

			let cardId = normalizeDuelsHeroCardId(stat.hero);
			if (statType === 'hero-power') {
				cardId = stat.heroPowerCardId;
			} else if (statType === 'signature-treasure') {
				cardId = stat.signatureTreasureCardId;
			}
			const refCard = allCards.getCard(cardId);
			return refCard?.name.toLowerCase().includes(searchString.toLowerCase());
		});
	return result;
	// We always show the "Heroic" stats, even when the filter is set to "Casual"
	// The only thing that will change are the player stats
	// .filter((stat) => (gameMode === 'all' ? true : stat.gameMode === gameMode))
};

export const filterDuelsTreasureStats = (
	treasures: readonly DuelsTreasureStat[],
	heroesFilter: DuelsHeroFilterType,
	heroPowerFilter: 'all' | string,
	sigTreasureFilter: 'all' | string,
	// timeFilter: DuelsTimeFilterType,
	statType: DuelsTreasureStatTypeFilterType,
	allCards: CardsFacadeService,
	searchString: string | null = null,
): readonly DuelsTreasureStat[] => {
	if (!treasures?.length) {
		return [];
	}

	const result = treasures
		.filter((stat) => !!stat)
		// Avoid generating errors when the API hasn't properly formatted the data yet
		.filter((stat) => !(+stat.treasureCardId > 0))
		.filter((stat) =>
			!heroesFilter?.length
				? false
				: heroesFilter.some((heroFilter) => normalizeDuelsHeroCardId(stat.hero) === heroFilter),
		)
		.filter((stat) => (heroPowerFilter === 'all' ? true : stat.heroPowerCardId === heroPowerFilter))
		.filter((stat) => (sigTreasureFilter === 'all' ? true : stat.signatureTreasureCardId === sigTreasureFilter))
		.filter((stat) => isCorrectType(stat, statType, allCards))
		.filter(
			(stat) =>
				!searchString?.length ||
				allCards.getCard(stat.treasureCardId)?.name.toLowerCase().includes(searchString.toLowerCase()),
		);
	// We always show the "Heroic" stats, even when the filter is set to "Casual"
	// The only thing that will change are the player stats
	// .filter((stat) => (gameMode === 'all' ? true : stat.gameMode === gameMode))
	if (!result.length) {
		console.log('no treasure to show', treasures?.length);
	}
	return result;
};

const isCorrectType = (
	stat: DuelsTreasureStat,
	statType: DuelsTreasureStatTypeFilterType,
	allCards: CardsFacadeService,
) => {
	switch (statType) {
		case 'treasure-1':
			return !isPassive(stat.treasureCardId, allCards) && duelsTreasureRank(stat.treasureCardId) === 1;
		case 'treasure-2':
			return !isPassive(stat.treasureCardId, allCards) && duelsTreasureRank(stat.treasureCardId) >= 2;
		case 'treasure-3':
			return !isPassive(stat.treasureCardId, allCards) && duelsTreasureRank(stat.treasureCardId) === 3;
		case 'passive-1':
			return isPassive(stat.treasureCardId, allCards) && duelsTreasureRank(stat.treasureCardId) === 1;
		case 'passive-2':
			return isPassive(stat.treasureCardId, allCards) && duelsTreasureRank(stat.treasureCardId) >= 2;
		case 'passive-3':
			return isPassive(stat.treasureCardId, allCards) && duelsTreasureRank(stat.treasureCardId) === 3;
	}
};

export const getGroupingKeyForHeroStat = (statType: DuelsStatTypeFilterType) => {
	switch (statType) {
		case 'hero':
			return (stat: DuelsHeroStat) => stat.hero;
		case 'hero-power':
			return (stat: DuelsHeroStat) => stat.heroPowerCardId;
		case 'signature-treasure':
			return (stat: DuelsHeroStat) => stat.signatureTreasureCardId;
	}
};
