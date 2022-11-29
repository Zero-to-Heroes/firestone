/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DeckDefinition, DeckList, decode } from '@firestone-hs/deckstrings';
import { GameFormat } from '@firestone-hs/reference-data';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DeckRankFilterType } from '../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { DeckSummary, DeckSummaryVersion } from '../../../models/mainwindow/decktracker/deck-summary';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { ConstructedDeckVersions } from '../../../models/mainwindow/decktracker/decktracker-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MatchupStat } from '../../../models/mainwindow/stats/matchup-stat';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { PatchInfo } from '../../../models/patches';
import { CardsFacadeService } from '../../cards-facade.service';
import { classes } from '../../hs-utils';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { deepEqual, groupByFunction, removeFromArray, sumOnArray } from '../../utils';

@Injectable()
export class DecksProviderService {
	public decks$ = new BehaviorSubject<readonly DeckSummary[]>(null);

	constructor(private readonly allCards: CardsFacadeService, private readonly store: AppUiStoreFacadeService) {
		window['decksProvider'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		combineLatest(
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav]) => main.decktracker.filters,
				([main, nav]) => main.decktracker.patch,
			),
			this.store.listenPrefs$(
				(prefs) => prefs.constructedPersonalAdditionalDecks,
				(prefs) => prefs.desktopDeckDeletes,
				(prefs) => prefs.desktopDeckHiddenDeckCodes,
				(prefs) => prefs.constructedDeckVersions,
				(prefs) => prefs.desktopDeckStatsReset,
				(prefs) => prefs.desktopDeckShowHiddenDecks,
			),
		)
			.pipe(
				filter(
					([
						stats,
						[filters, patch],
						[
							constructedPersonalAdditionalDecks,
							desktopDeckDeletes,
							desktopDeckHiddenDeckCodes,
							constructedDeckVersions,
							desktopDeckStatsReset,
							desktopDeckShowHiddenDecks,
						],
					]) => !!stats?.length && !!patch,
				),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				map(
					([
						stats,
						[filters, patch],
						[
							constructedPersonalAdditionalDecks,
							desktopDeckDeletes,
							desktopDeckHiddenDeckCodes,
							constructedDeckVersions,
							desktopDeckStatsReset,
							desktopDeckShowHiddenDecks,
						],
					]) => {
						return this.buildState(
							stats,
							filters,
							patch,
							constructedPersonalAdditionalDecks,
							desktopDeckDeletes,
							desktopDeckStatsReset,
							desktopDeckHiddenDeckCodes,
							constructedDeckVersions,
							desktopDeckShowHiddenDecks,
						);
					},
				),
			)
			.subscribe(this.decks$);
	}

	public buildState(
		stats: readonly GameStat[],
		filters: DeckFilters,
		patch: PatchInfo,
		personalDecks: readonly DeckSummary[],
		desktopDeckDeletes: { [deckstring: string]: readonly number[] },
		desktopDeckStatsReset: { [deckstring: string]: readonly number[] },
		desktopDeckHiddenDeckCodes: readonly string[],
		constructedDeckVersions: readonly ConstructedDeckVersions[],
		desktopDeckShowHiddenDecks: boolean,
	): readonly DeckSummary[] {
		// TODO: move applying prefs to UI. We don't need to recompute all matchups for all decks whenever we finish one game
		if (!stats || !stats?.length) {
			return personalDecks;
		}
		const rankedStats = stats.filter((stat) => stat.gameMode === 'ranked').filter((stat) => !!stat.playerDecklist);
		const statsByDeck = groupByFunction((stat: GameStat) => stat.playerDecklist)(rankedStats);
		// const validReplays = this.buildValidReplays(statsByDeck[deckstring], filters, prefs, patch);
		const deckstrings = Object.keys(statsByDeck);
		const decks: readonly DeckSummary[] = deckstrings.map((deckstring) =>
			this.buildDeckSummary(
				deckstring,
				statsByDeck[deckstring],
				desktopDeckHiddenDeckCodes,
				desktopDeckDeletes,
				desktopDeckStatsReset,
				desktopDeckShowHiddenDecks,
				filters,
				patch,
				statsByDeck[deckstring][0],
			),
		);

		// These only include the personal decks that haven't seen any play (otherwise they appear in the usual decks)
		const finalPersonalDecks = personalDecks
			.filter((deck) => !deckstrings.includes(deck.deckstring))
			.filter((deck) => !Object.keys(desktopDeckDeletes).includes(deck.deckstring))
			// Still need to filter these
			.filter((deck) => filters.gameFormat === 'all' || filters.gameFormat === deck.format)
			.map((deck) => {
				const deckDefinition = decode(deck.deckstring);
				return {
					...deck,
					skin: this.allCards.getCardFromDbfId(deckDefinition.heroes[0]).id,
					matchupStats: buildDefaultMatchupStats(),
					replays: [],
					totalGames: 0,
					totalWins: 0,
					hidden: desktopDeckHiddenDeckCodes.includes(deck.deckstring),
				} as DeckSummary;
			});

		const versionedDecks = this.consolidateDeckVersions(decks, constructedDeckVersions, desktopDeckHiddenDeckCodes);
		return [...versionedDecks, ...finalPersonalDecks];
	}

	private consolidateDeckVersions(
		decks: readonly DeckSummary[],
		constructedDeckVersions: readonly ConstructedDeckVersions[],
		desktopDeckHiddenDeckCodes: readonly string[],
	): readonly DeckSummary[] {
		const groupedByVersion = groupByFunction(
			(deck: DeckSummary) =>
				constructedDeckVersions.find((links) =>
					links.versions.map((v) => v.deckstring).includes(deck.deckstring),
				)?.versions[0].deckstring ?? deck.deckstring,
		)(decks);
		return Object.values(groupedByVersion).map((versions) =>
			this.groupDeckVersions(versions, desktopDeckHiddenDeckCodes),
		);
	}

	private groupDeckVersions(
		versions: readonly DeckSummary[],
		desktopDeckHiddenDeckCodes: readonly string[],
	): DeckSummary {
		// TODO: find a way to order versions, and take the one the user decides is the latest one
		const replays = versions
			.flatMap((v) => v.replays)
			.filter((r) => !!r)
			.sort((a, b) => b.creationTimestamp - a.creationTimestamp);
		if (!replays?.length) {
			return {
				...versions[0],
				allVersions: this.buildVersions(versions),
			};
		}

		const lastReplay = replays[0];
		const totalGames = sumOnArray(versions, (deck) => deck.totalGames);
		const totalWins = sumOnArray(versions, (deck) => deck.totalWins);
		const matchupStats = this.buildMatchupStats(replays);
		let decodedDeckName: string = null;
		try {
			decodedDeckName = decodeURIComponent(lastReplay.playerDeckName);
		} catch (e) {
			console.error('Could not decode deck name', lastReplay.playerDeckName, e);
		}
		return {
			class: lastReplay.playerClass,
			deckArchetype: lastReplay.playerArchetypeId,
			deckName: decodedDeckName,
			deckstring: lastReplay.playerDecklist,
			lastUsedTimestamp: lastReplay.creationTimestamp,
			skin: lastReplay.playerCardId,
			totalGames: totalGames,
			totalWins: totalWins,
			winRatePercentage: totalGames > 0 ? (100.0 * totalWins) / totalGames : null,
			hidden: versions.some((v) => desktopDeckHiddenDeckCodes.includes(v.deckstring)),
			matchupStats: matchupStats,
			format: versions.some((v) => v.format === 'classic')
				? 'classic'
				: versions.some((v) => v.format === 'wild')
				? 'wild'
				: 'standard',
			replays: replays,
			allVersions: this.buildVersions(versions),
		} as DeckSummary;
	}

	public static buildValidReplays(
		deckstring: string,
		stats: readonly GameStat[],
		gameFormatFilter: StatGameFormatType,
		gameModeFilter: StatGameModeType,
		timeFilter: DeckTimeFilterType,
		rankFilter: DeckRankFilterType,
		patch: PatchInfo,
		desktopDeckDeletes: { [deckstring: string]: readonly number[] },
		desktopDeckStatsReset: { [deckstring: string]: readonly number[] },
		desktopDeckHiddenDeckCodes: readonly string[],
		desktopDeckShowHiddenDecks: boolean,
		decks: readonly DeckSummary[] = null,
	): readonly GameStat[] {
		const resetForDeck = (desktopDeckStatsReset ?? {})[deckstring] ?? [];
		const lastResetDate = resetForDeck[0] ?? 0;
		const deleteForDeck = (desktopDeckDeletes ?? {})[deckstring] ?? [];
		const lastDeleteDate = deleteForDeck[0] ?? 0;

		// Because the method is used also to build the initial decks, we can't rely on the decks
		// to always be present
		const deckForDeckstring = !decks?.length
			? null
			: decks.find((d) => d.allVersions?.some((v) => v.deckstring === deckstring));
		const validDeckstrings = !!deckForDeckstring
			? deckForDeckstring.allVersions?.map((v) => v.deckstring)
			: [deckstring];

		const statsWithReset = stats
			.filter((stat) => validDeckstrings.includes(stat.playerDecklist))
			.filter((stat) => !!stat.opponentClass)
			.filter((stat) => stat.gameMode === gameModeFilter)
			.filter((stat) => gameFormatFilter === 'all' || stat.gameFormat === gameFormatFilter)
			.filter((stat) => DecksProviderService.isValidDate(stat, timeFilter, patch))
			// We have to also filter the info here, as otherwise we need to do a full state reset
			// after the user presses the delete button
			.filter((stat) => stat.creationTimestamp > lastResetDate)
			.filter((stat) => stat.creationTimestamp > lastDeleteDate);
		// Make sure that if the current filter is "season-start", the first game starts in Bronze
		// I think this doesn't work when you're mixing several formats together
		const replaysForSeasons =
			timeFilter === 'season-start'
				? [
						...DecksProviderService.replaysForSeason(
							statsWithReset.filter((stat) => stat.gameFormat === 'standard'),
						),
						...DecksProviderService.replaysForSeason(
							statsWithReset.filter((stat) => stat.gameFormat === 'wild'),
						),
						...DecksProviderService.replaysForSeason(
							statsWithReset.filter((stat) => stat.gameFormat === 'classic'),
						),
				  ]
				: statsWithReset;
		const hiddenDeckCodes = desktopDeckHiddenDeckCodes ?? [];
		const result = replaysForSeasons
			.filter((stat) => DecksProviderService.isValidRank(stat, rankFilter))
			.filter((stat) => stat.playerDecklist && stat.playerDecklist !== 'undefined')
			.filter((stat) => desktopDeckShowHiddenDecks || !hiddenDeckCodes.includes(stat.playerDecklist));
		return result;
	}

	private static replaysForSeason(replaysForDate: GameStat[]): readonly GameStat[] {
		let indexOfFirstGame = replaysForDate.length;
		for (let i = replaysForDate.length - 1; i >= 0; i--) {
			if (replaysForDate[i]?.playerRank?.includes('5-')) {
				indexOfFirstGame = i;
				break;
			}
		}
		return replaysForDate.slice(0, indexOfFirstGame + 1);
	}

	public static isValidDate(stat: GameStat, timeFilter: DeckTimeFilterType, lastPatch: PatchInfo): boolean {
		const now = Date.now();
		switch (timeFilter) {
			case 'season-start':
				const startOfMonthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
				return stat.creationTimestamp >= startOfMonthDate.getTime();
			case 'last-patch':
				// See bgs-ui-helper
				return (
					stat.buildNumber >= lastPatch.number ||
					stat.creationTimestamp > new Date(lastPatch.date).getTime() + 24 * 60 * 60 * 1000
				);
			case 'past-30':
				const past30Date = new Date(now - 30 * 24 * 60 * 60 * 1000);
				// Season starts always in Bronze
				return stat.creationTimestamp >= past30Date.getTime();
			case 'past-7':
				const past7Date = new Date(now - 7 * 24 * 60 * 60 * 1000);
				// Season starts always in Bronze
				return stat.creationTimestamp >= past7Date.getTime();
			case 'past-1':
				const past1Date = new Date(now - 1 * 24 * 60 * 60 * 1000);
				// Season starts always in Bronze
				return stat.creationTimestamp >= past1Date.getTime();
			case 'all-time':
			default:
				return true;
		}
	}

	private static isValidRank(stat: GameStat, rankFilter: DeckRankFilterType): boolean {
		const legendRank =
			stat.playerRank && stat.playerRank.indexOf('legend-') > -1
				? parseInt(stat.playerRank.split('legend-')[1])
				: null;
		const leagueId =
			!legendRank && stat.playerRank && stat.playerRank.indexOf('-') > -1
				? parseInt(stat.playerRank.split('-')[0])
				: null;
		switch (rankFilter) {
			case 'silver':
				return legendRank != null || (leagueId && leagueId <= 4);
			case 'gold':
				return legendRank != null || (leagueId && leagueId <= 3);
			case 'platinum':
				return legendRank != null || (leagueId && leagueId <= 2);
			case 'diamond':
				return legendRank != null || (leagueId && leagueId <= 1);
			case 'legend':
				return legendRank != null;
			case 'legend-500':
				return legendRank != null && legendRank <= 500;
			case 'all':
			default:
				return true;
		}
	}

	private buildDeckSummary(
		deckstring: string,
		stats: readonly GameStat[],
		desktopDeckHiddenDeckCodes: readonly string[],
		desktopDeckDeletes: { [deckstring: string]: readonly number[] },
		desktopDeckStatsReset: { [deckstring: string]: readonly number[] },
		desktopDeckShowHiddenDecks: boolean,
		filters: DeckFilters,
		patch: PatchInfo,
		sampleGame?: GameStat,
	): DeckSummary {
		const validStats: readonly GameStat[] = DecksProviderService.buildValidReplays(
			deckstring,
			stats,
			filters.gameFormat,
			filters.gameMode,
			filters.time,
			filters.rank,
			patch,
			desktopDeckDeletes,
			desktopDeckStatsReset,
			desktopDeckHiddenDeckCodes,
			desktopDeckShowHiddenDecks,
		);

		const deckName =
			stats.filter((stat) => stat.playerDeckName).length > 0
				? stats.filter((stat) => stat.playerDeckName)[0].playerDeckName
				: sampleGame?.playerDeckName;
		const deckArchetype =
			stats.filter((stat) => stat.playerArchetypeId).length > 0
				? stats.filter((stat) => stat.playerArchetypeId)[0].playerArchetypeId
				: sampleGame?.playerArchetypeId;
		const deckSkin =
			stats.filter((stat) => stat.playerCardId).length > 0
				? stats.filter((stat) => stat.playerCardId)[0].playerCardId
				: sampleGame?.playerCardId;
		const deckClass =
			stats.filter((stat) => stat.playerClass).length > 0
				? stats.filter((stat) => stat.playerClass)[0].playerClass
				: sampleGame?.playerClass;
		const totalGames = validStats.length;
		const totalWins = validStats.filter((stat) => stat.result === 'won').length;
		const lastUsed = validStats.filter((stat) => stat.creationTimestamp)?.length
			? validStats.filter((stat) => stat.creationTimestamp)[0]?.creationTimestamp
			: stats.filter((stat) => stat.creationTimestamp)?.length
			? stats.filter((stat) => stat.creationTimestamp)[0]?.creationTimestamp
			: undefined;
		const matchupStats: readonly MatchupStat[] = this.buildMatchupStats(validStats);
		let decodedDeckName: string = null;
		try {
			decodedDeckName = decodeURIComponent(deckName);
		} catch (e) {
			console.error('Could not decode deck name', deckName, e);
		}
		return {
			class: deckClass,
			deckName: decodedDeckName,
			deckArchetype: deckArchetype,
			deckstring: deckstring,
			lastUsedTimestamp: lastUsed,
			skin: deckSkin,
			totalGames: totalGames,
			totalWins: totalWins,
			winRatePercentage: totalGames > 0 ? (100.0 * totalWins) / totalGames : null,
			hidden: desktopDeckHiddenDeckCodes.includes(deckstring),
			matchupStats: matchupStats,
			format: this.buildFormat(deckstring),
			replays: validStats,
		} as DeckSummary;
	}

	private buildFormat(deckstring: string): StatGameFormatType {
		const deckInfo: DeckDefinition = decode(deckstring);
		switch (deckInfo.format) {
			case GameFormat.FT_CLASSIC:
				return 'classic';
			case GameFormat.FT_WILD:
				return 'wild';
			case GameFormat.FT_CLASSIC:
			default:
				return 'standard';
		}
	}

	private buildMatchupStats(stats: readonly GameStat[]): readonly MatchupStat[] {
		return classes.map((opponentClass) => {
			const games = stats.filter((stat) => stat.opponentClass?.toLowerCase() === opponentClass);
			return {
				opponentClass: opponentClass,
				totalGames: games.length,
				totalWins: games.filter((game) => game.result === 'won').length,
				totalGamesFirst: games.filter((game) => game.coinPlay === 'play').length,
				totalGamesCoin: games.filter((game) => game.coinPlay === 'coin').length,
				totalWinsFirst: games.filter((game) => game.coinPlay === 'play').filter((game) => game.result === 'won')
					.length,
				totalWinsCoin: games.filter((game) => game.coinPlay === 'coin').filter((game) => game.result === 'won')
					.length,
			} as MatchupStat;
		});
	}

	private buildVersions(versions: readonly DeckSummary[]): readonly DeckSummaryVersion[] {
		const deckLists = versions
			.map((version) => version.deckstring)
			.map((deckstring) => decode(deckstring))
			.map((deckDefinition) => deckDefinition.cards);
		const uniqueCardDbfIds = [...new Set(deckLists.flatMap((cardPair) => cardPair[0]))];
		const commonCardIdsWithMaxOccurrences: string[] = [];
		for (const cardDbfId of uniqueCardDbfIds) {
			const smallestCopiesInAllVersions = this.getSmallestOccurences(cardDbfId, deckLists);
			for (let i = 0; i < smallestCopiesInAllVersions; i++) {
				commonCardIdsWithMaxOccurrences.push(this.allCards.getCardFromDbfId(cardDbfId).id);
			}
		}
		// allCardsLimitedByMaxCopies
		// Find the cards that are in all the versions
		return versions
			.map((version) => {
				const deckCards = decode(version.deckstring)?.cards;
				const uniqueVersionCards = this.getUniqueVersionCards(deckCards, commonCardIdsWithMaxOccurrences);
				const fullyUniqueCards = this.getFullyUniqueVersionCards(
					uniqueVersionCards,
					commonCardIdsWithMaxOccurrences,
				);
				return {
					...version,
					differentCards: uniqueVersionCards,
					backgroundImage: `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${this.pickRandomCard(
						fullyUniqueCards,
					)}.jpg)`,
				};
			})
			.sort((a, b) => b.lastUsedTimestamp - a.lastUsedTimestamp);
	}

	private pickRandomCard(fullyUniqueCards: readonly string[]): string {
		const legendaries = fullyUniqueCards
			.map((cardId) => this.allCards.getCard(cardId))
			.filter((card) => card.rarity?.toLowerCase() === 'legendary')
			.sort((a, b) => b.cost - a.cost);
		if (!!legendaries?.length) {
			return legendaries[0].id;
		}

		const epics = fullyUniqueCards
			.map((cardId) => this.allCards.getCard(cardId))
			.filter((card) => card.rarity?.toLowerCase() === 'epic')
			.sort((a, b) => b.cost - a.cost);
		if (!!epics?.length) {
			return epics[0].id;
		}

		return fullyUniqueCards[0];
	}

	private getFullyUniqueVersionCards(
		uniqueVersionCards: readonly string[],
		commonCardIdsWithMaxOccurrences: readonly string[],
	): readonly string[] {
		const uniqueVersionCardIds = [...new Set(uniqueVersionCards)];
		const uniqueCommonCards = [...new Set(commonCardIdsWithMaxOccurrences)];
		for (const cardId of uniqueCommonCards) {
			removeFromArray(uniqueVersionCardIds, cardId);
		}
		return uniqueVersionCardIds;
	}

	private getUniqueVersionCards(deckCards: DeckList, commonCardIdsWithMaxOccurrences: string[]): readonly string[] {
		const result = [];
		const commonCardsCopy = [...commonCardIdsWithMaxOccurrences];
		for (const cardPair of deckCards) {
			const cardId = this.allCards.getCardFromDbfId(cardPair[0]).id;
			const quantity = cardPair[1];
			for (let i = 0; i < quantity; i++) {
				if (commonCardsCopy.includes(cardId)) {
					removeFromArray(commonCardsCopy, cardId);
				} else {
					result.push(cardId);
				}
			}
		}
		return result;
	}

	private getSmallestOccurences(cardDbfId: number, deckLists: DeckList[]): number {
		return Math.min(
			...deckLists.map((deckList) => {
				const pair = deckList.find((cardPair) => cardPair[0] === cardDbfId);
				return !!pair ? pair[1] : 0;
			}),
		);
	}
}

export const buildDefaultMatchupStats = () => {
	return classes.map(
		(oppClass) =>
			({
				opponentClass: oppClass,
				totalGames: 0,
			} as MatchupStat),
	);
};
