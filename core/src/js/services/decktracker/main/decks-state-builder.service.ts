/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { GameFormat } from '@firestone-hs/reference-data';
import { DeckDefinition, decode } from 'deckstrings';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DeckRankFilterType } from '../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { DeckSortType } from '../../../models/mainwindow/decktracker/deck-sort.type';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MatchupStat } from '../../../models/mainwindow/stats/matchup-stat';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { PatchInfo } from '../../../models/patches';
import { Preferences } from '../../../models/preferences';
import { classes } from '../../hs-utils';

@Injectable()
export class DecksStateBuilderService {
	public buildState(
		stats: StatsState,
		filters: DeckFilters,
		patch: PatchInfo,
		prefs: Preferences = null,
	): readonly DeckSummary[] {
		// console.log('[decktracker-stats-loader] update with stats');
		if (!stats || !stats.gameStats) {
			return [];
		}
		const validReplays = this.buildValidReplays(stats, filters, prefs, patch);
		// console.log('filtering done', prefs, validDecks, stats);
		const groupByDeckstring = groupBy('playerDecklist');
		const statsByDeck = groupByDeckstring(validReplays);
		// console.log('[decktracker-stats-loader] statsByDeck');
		// console.log('[decktracker-stats-loader] statsByDeck', statsByDeck);
		const deckstrings = Object.keys(statsByDeck);
		const decks: readonly DeckSummary[] = deckstrings
			.map((deckstring) => this.buildDeckSummary(deckstring, statsByDeck[deckstring], prefs))
			.sort(this.getSortFunction(filters.sort));

		return decks;
	}

	private buildValidReplays(
		stats: StatsState,
		filters: DeckFilters,
		prefs: Preferences,
		patch: PatchInfo,
	): readonly GameStat[] {
		const replaysForDate = stats.gameStats.stats
			// We have to also filter the info here, as otherwise we need to do a full state reset
			// after the user presses the delete button
			.filter(
				(stat) =>
					!prefs?.desktopDeckDeletes ||
					!prefs.desktopDeckDeletes[stat.playerDecklist]?.length ||
					prefs.desktopDeckDeletes[stat.playerDecklist][0] < stat.creationTimestamp,
			)
			.filter((stat) => filters.gameFormat === 'all' || stat.gameFormat === filters.gameFormat)
			.filter((stat) => stat.gameMode === filters.gameMode)
			.filter((stat) => DecksStateBuilderService.isValidDate(stat, filters.time, patch));
		// Make sure that if the current filter is "season-start", the first game starts in Bronze
		let indexOfFirstGame = replaysForDate.length;
		if (filters.time === 'season-start') {
			for (let i = replaysForDate.length - 1; i >= 0; i--) {
				if (replaysForDate[i]?.playerRank?.includes('5-')) {
					indexOfFirstGame = i;
					console.log('indexOfFirstGame', indexOfFirstGame);
					break;
				}
			}
		}
		const hiddenDeckCodes = prefs?.desktopDeckHiddenDeckCodes ?? [];
		return replaysForDate
			.slice(0, indexOfFirstGame + 1)
			.filter((stat) => this.isValidRank(stat, filters.rank))
			.filter((stat) => stat.playerDecklist && stat.playerDecklist !== 'undefined')
			.filter(
				(stat) => !prefs || prefs.desktopDeckShowHiddenDecks || !hiddenDeckCodes.includes(stat.playerDecklist),
			);
	}

	private getSortFunction(sort: DeckSortType): (a: DeckSummary, b: DeckSummary) => number {
		switch (sort) {
			case 'games-played':
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.totalGames <= b.totalGames) {
						return 1;
					}
					return -1;
				};
			case 'winrate':
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.winRatePercentage <= b.winRatePercentage) {
						return 1;
					}
					return -1;
				};
			case 'last-played':
			default:
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.lastUsedTimestamp <= b.lastUsedTimestamp) {
						return 1;
					}
					return -1;
				};
		}
	}

	public static isValidDate(stat: GameStat, timeFilter: DeckTimeFilterType, lastPatch: PatchInfo): boolean {
		const now = Date.now();
		switch (timeFilter) {
			case 'season-start':
				const startOfMonthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
				return stat.creationTimestamp >= startOfMonthDate.getTime();
			case 'last-patch':
				return stat.buildNumber >= lastPatch.number;
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

	private isValidRank(stat: GameStat, rankFilter: DeckRankFilterType): boolean {
		const legendRank =
			stat.playerRank && stat.playerRank.indexOf('legend-') > -1
				? parseInt(stat.playerRank.split('legend-')[0])
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
				// console.log('filtering', legendRank != null || leagueId >= 2, legendRank, leagueId, stat);
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

	private buildDeckSummary(deckstring: string, stats: readonly GameStat[], prefs: Preferences): DeckSummary {
		const statsWithReset = stats.filter(
			(stat) =>
				!prefs?.desktopDeckStatsReset ||
				!prefs.desktopDeckStatsReset[stat.playerDecklist]?.length ||
				prefs.desktopDeckStatsReset[stat.playerDecklist][0] < stat.creationTimestamp,
		);
		// console.debug(statsWithReset);
		const deckName =
			stats.filter((stat) => stat.playerDeckName).length > 0
				? stats.filter((stat) => stat.playerDeckName)[0].playerDeckName
				: undefined;
		const deckArchetype =
			stats.filter((stat) => stat.playerArchetypeId).length > 0
				? stats.filter((stat) => stat.playerArchetypeId)[0].playerArchetypeId
				: undefined;
		const deckSkin =
			stats.filter((stat) => stat.playerCardId).length > 0
				? stats.filter((stat) => stat.playerCardId)[0].playerCardId
				: undefined;
		const deckClass =
			stats.filter((stat) => stat.playerClass).length > 0
				? stats.filter((stat) => stat.playerClass)[0].playerClass
				: undefined;
		const totalGames = statsWithReset.length;
		const totalWins = statsWithReset.filter((stat) => stat.result === 'won').length;
		const lastUsed = statsWithReset.filter((stat) => stat.creationTimestamp)?.length
			? statsWithReset.filter((stat) => stat.creationTimestamp)[0]?.creationTimestamp
			: stats.filter((stat) => stat.creationTimestamp)?.length
			? stats.filter((stat) => stat.creationTimestamp)[0]?.creationTimestamp
			: undefined;
		const matchupStats: readonly MatchupStat[] = this.buildMatchupStats(statsWithReset);
		return Object.assign(new DeckSummary(), {
			class: deckClass,
			deckName: deckName,
			deckArchetype: deckArchetype,
			deckstring: deckstring,
			lastUsedTimestamp: lastUsed,
			skin: deckSkin,
			totalGames: totalGames,
			winRatePercentage: totalGames > 0 ? (100.0 * totalWins) / totalGames : null,
			hidden: prefs.desktopDeckHiddenDeckCodes.includes(deckstring),
			matchupStats: matchupStats,
			format: this.buildFormat(deckstring),
			replays: statsWithReset,
		} as DeckSummary);
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
}

const groupBy = (key) => (array) =>
	array.reduce((objectsByKeyValue, obj) => {
		const value = obj[key];
		objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
		return objectsByKeyValue;
	}, {});
