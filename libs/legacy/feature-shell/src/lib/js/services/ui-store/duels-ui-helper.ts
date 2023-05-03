import { DuelsHeroStat, DuelsTreasureStat, MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import {
	DuelsCombinedHeroStat,
	DuelsGameModeFilterType,
	DuelsHeroFilterType,
	DuelsStatTypeFilterType,
	DuelsTimeFilterType,
	buildDuelsCombinedHeroStats,
	getGroupingKeyForHeroStat as groupingKey,
} from '@firestone/duels/data-access';
import { GameStat } from '@firestone/stats/data-access';
import { DuelsTopDecksDustFilterType } from '@models/duels/duels-types';
import { DuelsGroupedDecks } from '../../models/duels/duels-grouped-decks';
import { DuelsDeckSummary } from '../../models/duels/duels-personal-deck';
import { DuelsDeckStat, DuelsHeroPlayerStat } from '../../models/duels/duels-player-stats';
import { DuelsRun } from '../../models/duels/duels-run';
import { PatchInfo } from '../../models/patches';
import { sumOnArray } from '../utils';

export const buildDuelsHeroPlayerStats = (
	duelStats: readonly DuelsHeroStat[],
	statType: DuelsStatTypeFilterType,
	playerRuns: readonly DuelsRun[] = [],
): DuelsHeroPlayerStat[] => {
	const combinedHeroStats = buildDuelsCombinedHeroStats(duelStats, groupingKey(statType));
	return combinedHeroStats.map((stat) => {
		const key = getGroupingKeyForHeroStat(statType)(stat);
		const validRuns = playerRuns.filter((run) => isRelevantRunForHeroStat(run, statType, key));
		return {
			...stat,
			// TODO: rename this to totalRuns
			playerTotalMatches: validRuns.length,
			playerPopularity: validRuns.length ? (100 * validRuns.length) / playerRuns.length : null,
			playerWinrate: validRuns.length
				? (100 * validRuns.map((run) => run.wins).reduce((a, b) => a + b, 0)) /
				  validRuns.map((run) => run.wins + run.losses).reduce((a, b) => a + b, 0)
				: null,
		};
	});
};

export const buildDuelsHeroTreasurePlayerStats = (
	duelStats: readonly DuelsTreasureStat[],
	playerRuns: readonly DuelsRun[] = [],
): readonly DuelsHeroPlayerStat[] => {
	const combinedHeroStats = buildDuelsCombinedHeroStats(duelStats, (stat: DuelsTreasureStat) => stat.treasureCardId);
	return combinedHeroStats.map((stat) => {
		const key = stat.cardId;
		const validRuns = playerRuns.filter((run) => isRelevantRun(run, key));
		return {
			...stat,
			// TODO: rename this to totalRuns
			playerTotalMatches: validRuns.length,
			playerPopularity: validRuns.length ? (100 * validRuns.length) / playerRuns.length : null,
			playerWinrate: validRuns.length
				? (100 * validRuns.map((run) => run.wins).reduce((a, b) => a + b, 0)) /
				  validRuns.map((run) => run.wins + run.losses).reduce((a, b) => a + b, 0)
				: null,
		};
	});
};

export const filterDuelsRuns = (
	runs: readonly DuelsRun[],
	timeFilter: DuelsTimeFilterType,
	heroesFilter: DuelsHeroFilterType,
	gameMode: DuelsGameModeFilterType,
	duelsDeckDeletes: { [deckstring: string]: readonly number[] },
	patch: PatchInfo,
	mmrFilter: number,
	heroPowerFilter: readonly string[] = [],
	signatureTreasureFilter: readonly string[] = [],
	statType: DuelsStatTypeFilterType = null,
) => {
	if (!runs?.length) {
		return [];
	}

	if (!patch) {
		console.warn('missing patch', new Error().stack);
	}

	return (
		runs
			// Keep only runs that have been created after the deck's initial deletion date
			.filter(
				(run) =>
					!duelsDeckDeletes ||
					!duelsDeckDeletes[run.initialDeckList]?.length ||
					duelsDeckDeletes[run.initialDeckList][duelsDeckDeletes[run.initialDeckList].length - 1] <
						run.creationTimestamp,
			)
			.filter((run) => (mmrFilter as any) === 'all' || run.ratingAtStart >= mmrFilter)
			.filter((run) => isCorrectRunDate(run, timeFilter, patch))
			.filter((run) => (gameMode === 'all' ? true : run.type === gameMode))
			.filter((run) =>
				!heroesFilter?.length
					? true
					: heroesFilter.some((heroFilter) => normalizeDuelsHeroCardId(run.heroCardId) === heroFilter),
			)
			.filter((stat) =>
				// Don't consider the hero power filter when filtering heroes, as there is always only one hero for
				// a given hero power (so we only have one result at the end, which isn't really useful for comparison)
				!heroPowerFilter?.length || statType !== 'signature-treasure'
					? true
					: heroPowerFilter.includes(stat.heroPowerCardId),
			)
			.filter((stat) =>
				// Similar
				!signatureTreasureFilter?.length || statType !== 'hero-power'
					? true
					: signatureTreasureFilter.includes(stat.signatureTreasureCardId),
			)
	);
};

// Because of the neutral heroes
export const mergeDuelsHeroPlayerStats = (
	statsToMerge: readonly DuelsHeroPlayerStat[],
	cardIdOverride: string,
): DuelsHeroPlayerStat => {
	const refStat = statsToMerge[0];
	if (!refStat) {
		return null;
	}

	const totalRuns = (100 * refStat.globalTotalMatches) / refStat.globalPopularity;
	const totalMatchesForGroup = statsToMerge.map((g) => g.globalTotalMatches).reduce((a, b) => a + b, 0);
	const winsDistribution: { winNumber: number; value: number }[] = [];
	for (let i = 0; i <= 12; i++) {
		const totalWinsForNumber = statsToMerge.map((g) => g.globalWinDistribution[i].value).reduce((a, b) => a + b, 0);
		winsDistribution.push({ winNumber: i, value: (100 * totalWinsForNumber) / totalMatchesForGroup });
	}
	const totalWins = statsToMerge
		.map((stat) => stat.globalWinrate * stat.globalTotalMatches)
		.reduce((a, b) => a + b, 0);

	const playerTotalMatches = (100 * refStat.playerTotalMatches) / refStat.playerPopularity;
	const playerTotalMatchesForGroup = sumOnArray(statsToMerge, (stat) => stat.playerTotalMatches);
	const playerTotalWins = statsToMerge
		.map((stat) => stat.playerWinrate * stat.playerTotalMatches)
		.reduce((a, b) => a + b, 0);

	return {
		hero: cardIdOverride,
		heroPower: statsToMerge[0].heroPower,
		signatureTreasure: statsToMerge[0].signatureTreasure,
		periodStart: null,
		cardId: cardIdOverride,
		globalPopularity: (100 * totalMatchesForGroup) / totalRuns,
		globalTotalMatches: totalMatchesForGroup,

		globalWinrate: totalWins / totalMatchesForGroup,
		globalWinDistribution: winsDistribution as readonly { winNumber: number; value: number }[],
		playerTotalMatches: playerTotalMatchesForGroup,
		playerPopularity: playerTotalMatches ? (100 * playerTotalMatches) / playerTotalMatchesForGroup : null,
		playerWinrate: playerTotalMatchesForGroup ? playerTotalWins / playerTotalMatchesForGroup : null,
	} as DuelsHeroPlayerStat;
};

export const getCurrentDeck = (
	decks: readonly DuelsDeckSummary[],
	deckstring: string,
	topDecks: readonly DuelsGroupedDecks[],
	deckId: number,
	timeFilter: DuelsTimeFilterType,
	heroFilter: DuelsHeroFilterType,
	gameMode: DuelsGameModeFilterType,
	duelsDeckDeletes: { [deckstring: string]: readonly number[] },
	patch: PatchInfo,
	mmrFilter: number,
	deckDetails: readonly DuelsDeckStat[] = [],
): DeckInfo => {
	if (!!deckstring?.length) {
		const deck = decks.find((deck) => deck.initialDeckList === deckstring);
		if (!deck) {
			return null;
		}
		const runs = filterDuelsRuns(deck.runs, timeFilter, heroFilter, gameMode, duelsDeckDeletes, patch, mmrFilter);
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
	return (mmrPercentiles.find((p) => p.percentile === mmrFilter) ?? mmrPercentiles.find((p) => p.percentile === 100))
		?.mmr;
};

const isCorrectRunDate = (run: DuelsRun, timeFilter: DuelsTimeFilterType, patch: PatchInfo): boolean => {
	switch (timeFilter) {
		case 'all-time':
			return true;
		case 'last-patch':
			// See bgs-ui-helper
			return (
				!!patch &&
				(run.buildNumberAtStart >= patch.number ||
					run.creationTimestamp > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000)
			);
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
		deckName: null,
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

export const topDeckApplyFilters = (
	grouped: DuelsGroupedDecks,
	mmrFilter: number,
	heroFilter: DuelsHeroFilterType,
	heroPowerFilter: readonly string[],
	sigTreasureFilter: readonly string[],
	timeFilter: DuelsTimeFilterType,
	dustFilter: DuelsTopDecksDustFilterType,
	passivesFilter: readonly string[],
	patch: PatchInfo,
	searchString: string = null,
): DuelsGroupedDecks => {
	return {
		...grouped,
		decks: grouped.decks
			.filter((deck) => topDeckStringFilter(deck, searchString))
			.filter((deck) => topDeckMmrFilter(deck, mmrFilter))
			.filter((deck) => topDeckHeroFilter(deck, heroFilter))
			.filter((deck) => topDeckHeroPowerFilter(deck, heroPowerFilter))
			.filter((deck) => topDeckSigTreasureFilter(deck, sigTreasureFilter))
			.filter((deck) => topDeckTimeFilter(deck, timeFilter, patch))
			.filter((deck) => topDeckDustFilter(deck, dustFilter))
			.filter((deck) => topDeckPassivesFilter(deck, passivesFilter)),
	};
};

const topDeckStringFilter = (deck: DuelsDeckStat, searchString: string): boolean => {
	if (!searchString) {
		return true;
	}
	return deck.allCardNames?.some((n) => n.toLowerCase().includes(searchString.toLowerCase()));
};

const topDeckPassivesFilter = (deck: DuelsDeckStat, filter: readonly string[]): boolean => {
	return !filter?.length || deck.treasuresCardIds?.some((cardId) => filter.includes(cardId));
};

const topDeckMmrFilter = (deck: DuelsDeckStat, filter: number): boolean => {
	return !filter || (filter as any) === 'all' || deck.rating >= filter;
};

const topDeckHeroFilter = (deck: DuelsDeckStat, filters: DuelsHeroFilterType): boolean => {
	return !filters?.length || filters.some((heroFilter) => normalizeDuelsHeroCardId(deck.heroCardId) === heroFilter);
};

const topDeckHeroPowerFilter = (deck: DuelsDeckStat, filters: readonly string[]): boolean => {
	return !filters?.length || filters.some((filter) => deck.heroPowerCardId === filter);
};

const topDeckSigTreasureFilter = (deck: DuelsDeckStat, filters: readonly string[]): boolean => {
	return !filters?.length || filters.some((filter) => deck.signatureTreasureCardId === filter);
};

const topDeckDustFilter = (deck: DuelsDeckStat, filter: DuelsTopDecksDustFilterType): boolean => {
	if (!filter) {
		return true;
	}

	switch (filter) {
		case 'all':
			return true;
		default:
			return deck.dustCost <= parseInt(filter);
	}
};

const topDeckTimeFilter = (deck: DuelsDeckStat, filter: DuelsTimeFilterType, patch: PatchInfo): boolean => {
	if (!filter) {
		return true;
	}
	switch (filter) {
		case 'all-time':
			return true;
		case 'last-patch':
			// See bgs-ui-helper
			return (
				patch &&
				(deck.buildNumber >= patch.number ||
					new Date(deck.periodStart).getTime() > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000)
			);
		case 'past-seven':
			return new Date(deck.periodStart) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		case 'past-three':
			return new Date(deck.periodStart) >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
	}
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

export const getGroupingKeyForHeroStat = (statType: DuelsStatTypeFilterType) => {
	switch (statType) {
		case 'hero':
			return (stat: DuelsCombinedHeroStat) => stat.hero;
		case 'hero-power':
			return (stat: DuelsCombinedHeroStat) => stat.heroPower;
		case 'signature-treasure':
			return (stat: DuelsCombinedHeroStat) => stat.signatureTreasure;
	}
};
