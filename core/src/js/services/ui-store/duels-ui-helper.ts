import { DuelsHeroStat, DuelsTreasureStat, MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsClassFilterType } from '../../models/duels/duels-class-filter.type';
import { DuelsGameModeFilterType } from '../../models/duels/duels-game-mode-filter.type';
import { DuelsGroupedDecks } from '../../models/duels/duels-grouped-decks';
import { DuelsDeckSummary } from '../../models/duels/duels-personal-deck';
import { DuelsDeckStat, DuelsHeroPlayerStat } from '../../models/duels/duels-player-stats';
import { DuelsRun } from '../../models/duels/duels-run';
import { DuelsStatTypeFilterType } from '../../models/duels/duels-stat-type-filter.type';
import { DuelsTimeFilterType } from '../../models/duels/duels-time-filter.type';
import { DuelsTreasureStatTypeFilterType } from '../../models/duels/duels-treasure-stat-type-filter.type';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../models/patches';
import { CardsFacadeService } from '../cards-facade.service';
import { duelsTreasureRank, getDuelsHeroCardId, isPassive } from '../duels/duels-utils';
import { groupByFunction } from '../utils';

export const filterDuelsHeroStats = (
	heroStats: readonly DuelsHeroStat[],
	timeFilter: DuelsTimeFilterType,
	classFilter: DuelsClassFilterType,
	heroPowerFilter: 'all' | string,
	signatureTreasureFilter: 'all' | string,
	statType: DuelsStatTypeFilterType,
	mmrFilter: 100 | 50 | 25 | 10 | 1,
	allCards: CardsFacadeService,
	searchString: string = null,
): readonly DuelsHeroStat[] => {
	return (
		heroStats
			.filter((stat) => stat.date === timeFilter)
			// For backward compatibility
			.filter((stat) => stat.mmrPercentile === mmrFilter || mmrFilter >= 100)
			.filter((stat) => (classFilter === 'all' ? true : stat.playerClass === classFilter))
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
			.filter((stat) => {
				if (!searchString?.length) {
					return true;
				}

				let cardId = getDuelsHeroCardId(stat.playerClass);
				if (statType === 'hero-power') {
					cardId = stat.heroPowerCardId;
				} else if (statType === 'signature-treasure') {
					cardId = stat.signatureTreasureCardId;
				}
				return allCards.getCard(cardId)?.name.toLowerCase().includes(searchString.toLowerCase());
			})
	);
	// We always show the "Heroic" stats, even when the filter is set to "Casual"
	// The only thing that will change are the player stats
	// .filter((stat) => (gameMode === 'all' ? true : stat.gameMode === gameMode))
};

export const filterDuelsTreasureStats = (
	treasures: readonly DuelsTreasureStat[],
	timeFilter: DuelsTimeFilterType,
	classFilter: DuelsClassFilterType,
	heroPowerFilter: 'all' | string,
	sigTreasureFilter: 'all' | string,
	statType: DuelsTreasureStatTypeFilterType,
	mmrFilter: 100 | 50 | 25 | 10 | 1,
	allCards: CardsFacadeService,
	searchString: string = null,
): readonly DuelsTreasureStat[] => {
	if (!treasures?.length) {
		return [];
	}

	const result = treasures
		.filter((stat) => !!stat)
		// Avoid generating errors when the API hasn't properly formatted the data yet
		.filter((stat) => !(+stat.treasureCardId > 0))
		.filter((stat) => stat.date === timeFilter)
		.filter((stat) => stat.mmrPercentile === mmrFilter || mmrFilter >= 100)
		.filter((stat) => (classFilter === 'all' ? true : stat.playerClass === classFilter))
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

export const filterDuelsRuns = (
	runs: readonly DuelsRun[],
	timeFilter: DuelsTimeFilterType,
	classFilter: DuelsClassFilterType,
	gameMode: DuelsGameModeFilterType,
	patch: PatchInfo,
	mmrFilter: number,
	heroPowerFilter: 'all' | string = 'all',
	signatureTreasureFilter: 'all' | string = 'all',
	statType: DuelsStatTypeFilterType = null,
) => {
	if (!runs?.length) {
		return [];
	}

	return runs
		.filter((run) => run.ratingAtStart >= mmrFilter)
		.filter((run) => isCorrectRunDate(run, timeFilter, patch))
		.filter((run) => (gameMode === 'all' ? true : run.type === gameMode))
		.filter((run) => (classFilter === 'all' ? true : run.heroCardId === getDuelsHeroCardId(classFilter)))
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
		);
};

export const buildDuelsHeroTreasurePlayerStats = (
	duelStats: readonly DuelsTreasureStat[],
	playerRuns: readonly DuelsRun[] = [],
): readonly DuelsHeroPlayerStat[] => {
	const totalRuns = duelStats.map((stat) => stat.totalRuns).reduce((a, b) => a + b, 0);
	const grouped: { [cardId: string]: readonly DuelsTreasureStat[] } = groupByFunction(
		(stat: DuelsTreasureStat) => stat.treasureCardId,
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
		const validRuns = playerRuns.filter((run) => isRelevantRun(run, key));
		return {
			heroClass: group[0].playerClass,
			periodStart: null,
			cardId: key,
			globalPopularity: (100 * totalRunsForGroup) / totalRuns,
			// TODO: rename this to totalRuns
			globalTotalMatches: totalRunsForGroup,
			globalWinrate: (100 * group.map((g) => g.totalWins).reduce((a, b) => a + b, 0)) / totalMatchesForGroup,
			globalWinDistribution: winsDistribution as readonly { winNumber: number; value: number }[],
			// TODO: rename this to totalRuns
			playerTotalMatches: validRuns.length,
			playerPopularity: validRuns.length ? (100 * validRuns.length) / playerRuns.length : null,
			playerWinrate: validRuns.length
				? (100 * validRuns.map((run) => run.wins).reduce((a, b) => a + b, 0)) /
				  validRuns.map((run) => run.wins + run.losses).reduce((a, b) => a + b, 0)
				: null,
		} as DuelsHeroPlayerStat;
	});
};

export const buildDuelsHeroPlayerStats = (
	duelStats: readonly DuelsHeroStat[],
	statType: DuelsStatTypeFilterType,
	runs: readonly DuelsRun[] = [],
): DuelsHeroPlayerStat[] => {
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
		const validRuns = runs.filter((run) => isRelevantRunForHeroStat(run, statType, key));
		return {
			heroClass: group[0].playerClass,
			periodStart: null,
			cardId: key,
			globalPopularity: (100 * totalRunsForGroup) / totalRuns,
			// TODO: rename this to totalRuns
			globalTotalMatches: totalRunsForGroup,
			globalWinrate: (100 * group.map((g) => g.totalWins).reduce((a, b) => a + b, 0)) / totalMatchesForGroup,
			globalWinDistribution: winsDistribution as readonly { winNumber: number; value: number }[],
			// TODO: rename this to totalRuns
			playerTotalMatches: validRuns.length,
			playerPopularity: validRuns.length ? (100 * validRuns.length) / runs.length : null,
			playerWinrate: validRuns.length
				? (100 * validRuns.map((run) => run.wins).reduce((a, b) => a + b, 0)) /
				  validRuns.map((run) => run.wins + run.losses).reduce((a, b) => a + b, 0)
				: null,
		} as DuelsHeroPlayerStat;
	});
};

export const getCurrentDeck = (
	decks: readonly DuelsDeckSummary[],
	deckstring: string,
	topDecks: readonly DuelsGroupedDecks[],
	deckId: number,
	timeFilter: DuelsTimeFilterType,
	classFilter: DuelsClassFilterType,
	gameMode: DuelsGameModeFilterType,
	patch: PatchInfo,
	mmrFilter: number,
	deckDetails: readonly DuelsDeckStat[] = [],
): DeckInfo => {
	if (!!deckstring?.length) {
		const deck = decks.find((deck) => deck.initialDeckList === deckstring);
		if (!deck) {
			return null;
		}
		const runs = filterDuelsRuns(deck.runs, timeFilter, classFilter, gameMode, patch, mmrFilter);
		return {
			personal: true,
			run: null,
			deck: {
				...deck,
				runs: runs,
				skin: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${deck.heroCardId}.jpg`,
				winrate: runs.length > 0 ? buildWinrate(runs) : null,
			} as ExtendedDuelsDeckSummary,
		} as DeckInfo;
	}
	return getTopDeck(topDecks, deckDetails ?? [], deckId);
};

export const getDuelsMmrFilterNumber = (
	mmrPercentiles: readonly MmrPercentile[],
	mmrFilter: 100 | 50 | 25 | 10 | 1,
) => {
	return (
		mmrPercentiles.find((p) => p.percentile === +mmrFilter)?.mmr ??
		mmrPercentiles.find((p) => p.percentile === 100).mmr
	);
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

const isCorrectRunDate = (run: DuelsRun, timeFilter: DuelsTimeFilterType, patch: PatchInfo): boolean => {
	switch (timeFilter) {
		case 'all-time':
			return true;
		case 'last-patch':
			return run.buildNumberAtStart >= patch.number && run.creationTimestamp > new Date(patch.date).getTime();
		case 'past-seven':
			return new Date(run.creationTimestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		case 'past-three':
			return new Date(run.creationTimestamp) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
	}
};

const isRelevantRun = (run: DuelsRun, key: string): boolean => {
	return !!run.steps
		.filter((step) => (step as DuelsRunInfo).bundleType === 'treasure')
		.map((step) => step as DuelsRunInfo)
		.map((choice) => getPickedCard(choice))
		.some((treasure) => treasure === key);
};

const getPickedCard = (choice: DuelsRunInfo): string => {
	return choice[`option${choice.chosenOptionIndex}`];
};

const isRelevantRunForHeroStat = (run: DuelsRun, statType: string, key: string): boolean => {
	switch (statType) {
		case 'hero':
			// TODO: normalize hero card id if at one point we have skins
			return run.heroCardId === key;
		case 'hero-power':
			return run.heroPowerCardId === key;
		case 'signature-treasure':
			return run.signatureTreasureCardId === key;
	}
};

const getGroupingKeyForHeroStat = (statType: DuelsStatTypeFilterType) => {
	switch (statType) {
		case 'hero':
			return (stat: DuelsHeroStat) => getDuelsHeroCardId(stat.playerClass);
		case 'hero-power':
			return (stat: DuelsHeroStat) => stat.heroPowerCardId;
		case 'signature-treasure':
			return (stat: DuelsHeroStat) => stat.signatureTreasureCardId;
	}
};

const getTopDeck = (
	topDecks: readonly DuelsGroupedDecks[],
	additionalDeckDetails: readonly DuelsDeckStat[],
	deckId: number,
): DeckInfo => {
	const deckStat: DuelsDeckStat = topDecks
		.map((grouped) => grouped.decks)
		.reduce((a, b) => a.concat(b), [])
		.find((deck) => deck?.id === deckId);
	if (!deckStat) {
		console.error('[duels-personal-deck-details] could not find deckstat', deckId);
		return null;
	}
	const additionalStat = additionalDeckDetails.find((stat) => stat.id === deckStat.id);
	const run: DuelsRun = {
		creationTimestamp: undefined,
		id: deckStat.runId,
		ratingAtEnd: undefined,
		ratingAtStart: undefined,
		rewards: undefined,
		heroCardId: deckStat.heroCardId,
		heroPowerCardId: deckStat.heroPowerCardId,
		initialDeckList: deckStat.decklist,
		losses: deckStat.losses,
		signatureTreasureCardId: deckStat.signatureTreasureCardId,
		type: deckStat.gameMode,
		wins: deckStat.wins,
		steps: deckStat.steps ?? additionalStat?.steps,
		buildNumberAtStart: deckStat.buildNumber,
	};
	const deckSummary: DuelsDeckSummary = {
		deckName: 'tmp',
		runs: [run],
		initialDeckList: deckStat.decklist ?? run.initialDeckList,
		heroCardId: deckStat.heroCardId,
		playerClass: deckStat.playerClass,
		global: null,
		heroPowerStats: null,
		signatureTreasureStats: null,
		treasureStats: null,
		lootStats: null,
		deckStatsForTypes: null,
		hidden: false,
	};
	return {
		personal: false,
		run: run,
		deck: {
			...deckSummary,
			skin: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${deckStat.heroCardId}.jpg`,
			winrate: deckSummary.global?.winrate || buildWinrate(deckSummary.runs),
		} as ExtendedDuelsDeckSummary,
	};
};

const buildWinrate = (runs: readonly DuelsRun[]): number => {
	const games = runs
		.map((run) => run.steps)
		.reduce((a, b) => a.concat(b), [])
		.filter((step) => (step as GameStat)?.opponentCardId)
		.map((step) => step as GameStat);
	return (100 * games.filter((game) => game.result === 'won').length) / games.length;
};

export interface DeckInfo {
	personal: boolean;
	run: DuelsRun;
	deck: ExtendedDuelsDeckSummary;
}

export interface ExtendedDuelsDeckSummary extends DuelsDeckSummary {
	skin: string;
	winrate: number;
}
