/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { GameFormat } from '@firestone-hs/reference-data';
import { DeckDefinition, decode } from 'deckstrings';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DeckRankFilterType } from '../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { DeckSummary, DeckSummaryVersion } from '../../../models/mainwindow/decktracker/deck-summary';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { ConstructedDeckVersions } from '../../../models/mainwindow/decktracker/decktracker-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MatchupStat } from '../../../models/mainwindow/stats/matchup-stat';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { PatchInfo } from '../../../models/patches';
import { Preferences } from '../../../models/preferences';
import { CardsFacadeService } from '../../cards-facade.service';
import { classes } from '../../hs-utils';
import { groupByFunction, sumOnArray } from '../../utils';

@Injectable()
export class DecksStateBuilderService {
	constructor(private readonly allCards: CardsFacadeService) {}

	public buildState(
		stats: StatsState,
		filters: DeckFilters,
		patch: PatchInfo,
		prefs: Preferences,
	): readonly DeckSummary[] {
		const personalDecks = prefs.constructedPersonalAdditionalDecks ?? [];
		// TODO: move applying prefs to UI. We don't need to recompute all matchups for all decks whenever we finish one game
		if (!stats || !stats.gameStats?.stats?.length) {
			return personalDecks;
		}
		const rankedStats = stats.gameStats.stats
			.filter((stat) => stat.gameMode === 'ranked')
			.filter((stat) => !!stat.playerDecklist);
		const statsByDeck = groupByFunction((stat: GameStat) => stat.playerDecklist)(rankedStats);
		// const validReplays = this.buildValidReplays(statsByDeck[deckstring], filters, prefs, patch);
		const deckstrings = Object.keys(statsByDeck);
		const decks: readonly DeckSummary[] = deckstrings.map((deckstring) =>
			this.buildDeckSummary(
				deckstring,
				statsByDeck[deckstring],
				prefs,
				filters,
				patch,
				statsByDeck[deckstring][0],
			),
		);
		console.debug('[deck] decks after deckstring maps', decks);

		// These only include the personal decks that haven't seen any play (otherwise they appear in the usual decks)
		const finalPersonalDecks = personalDecks
			.filter((deck) => !deckstrings.includes(deck.deckstring))
			.filter((deck) => !Object.keys(prefs.desktopDeckDeletes).includes(deck.deckstring))
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
					hidden: prefs.desktopDeckHiddenDeckCodes.includes(deck.deckstring),
				} as DeckSummary;
			});

		const versionedDecks = this.consolidateDeckVersions(
			decks,
			prefs.constructedDeckVersions,
			prefs.desktopDeckHiddenDeckCodes,
		);
		console.debug('[deck] versionedDeck', versionedDecks, decks);
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
		console.debug('[deck], groupedByVersion', groupedByVersion, constructedDeckVersions);
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
		console.debug('[deck] replays', replays, versions);
		if (!replays?.length) {
			return {
				...versions[0],
				allVersions: this.buildVersions(versions),
			};
		}

		const lastReplay = replays[replays.length - 1];
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
		prefs: Preferences,
		patch: PatchInfo,
	): readonly GameStat[] {
		const resetForDeck = (prefs?.desktopDeckStatsReset ?? {})[deckstring] ?? [];
		const lastResetDate = resetForDeck[0] ?? 0;
		const deleteForDeck = (prefs?.desktopDeckDeletes ?? {})[deckstring] ?? [];
		const lastDeleteDate = deleteForDeck[0] ?? 0;

		const statsWithReset = stats
			.filter((stat) => stat.playerDecklist === deckstring)
			.filter((stat) => !!stat.opponentClass)
			.filter((stat) => stat.gameMode === gameModeFilter)
			.filter((stat) => gameFormatFilter === 'all' || stat.gameFormat === gameFormatFilter)
			.filter((stat) => DecksStateBuilderService.isValidDate(stat, timeFilter, patch))
			// We have to also filter the info here, as otherwise we need to do a full state reset
			// after the user presses the delete button
			.filter((stat) => stat.creationTimestamp > lastResetDate)
			.filter((stat) => stat.creationTimestamp > lastDeleteDate);
		// Make sure that if the current filter is "season-start", the first game starts in Bronze
		// I think this doesn't work when you're mixing several formats together
		const replaysForSeasons =
			timeFilter === 'season-start'
				? [
						...DecksStateBuilderService.replaysForSeason(
							statsWithReset.filter((stat) => stat.gameFormat === 'standard'),
						),
						...DecksStateBuilderService.replaysForSeason(
							statsWithReset.filter((stat) => stat.gameFormat === 'wild'),
						),
						...DecksStateBuilderService.replaysForSeason(
							statsWithReset.filter((stat) => stat.gameFormat === 'classic'),
						),
				  ]
				: statsWithReset;
		const hiddenDeckCodes = prefs?.desktopDeckHiddenDeckCodes ?? [];
		const result = replaysForSeasons
			.filter((stat) => DecksStateBuilderService.isValidRank(stat, rankFilter))
			.filter((stat) => stat.playerDecklist && stat.playerDecklist !== 'undefined')
			.filter(
				(stat) => !prefs || prefs.desktopDeckShowHiddenDecks || !hiddenDeckCodes.includes(stat.playerDecklist),
			);
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
		prefs: Preferences,
		filters: DeckFilters,
		patch: PatchInfo,
		sampleGame?: GameStat,
	): DeckSummary {
		const validStats: readonly GameStat[] = DecksStateBuilderService.buildValidReplays(
			deckstring,
			stats,
			filters.gameFormat,
			filters.gameMode,
			filters.time,
			filters.rank,
			prefs,
			patch,
		);
		console.debug(
			'[deck] built valid replays',
			validStats.length && validStats[0].playerDeckName,
			prefs,
			filters,
			validStats,
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
			hidden: prefs.desktopDeckHiddenDeckCodes.includes(deckstring),
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
		// Find the cards that are in all the versions
		return [];
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
