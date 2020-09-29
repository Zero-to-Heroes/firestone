/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DeckSortType } from '../../../models/mainwindow/decktracker/deck-sort.type';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { DeckTimeFilterType } from '../../../models/mainwindow/decktracker/deck-time-filter.type';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';

@Injectable()
export class DecksStateBuilderService {
	public buildState(stats: StatsState, filters: DeckFilters): readonly DeckSummary[] {
		// console.log('[decktracker-stats-loader] update with stats');
		if (!stats || !stats.gameStats) {
			return [];
		}
		const validDecks = stats.gameStats.stats
			.filter(stat => stat.gameFormat === filters.gameFormat)
			.filter(stat => stat.gameMode === filters.gameMode)
			.filter(stat => this.isValidDate(stat, filters.time))
			.filter(stat => stat.playerDecklist && stat.playerDecklist !== 'undefined');
		const groupByDeckstring = groupBy('playerDecklist');
		const statsByDeck = groupByDeckstring(validDecks);
		// console.log('[decktracker-stats-loader] statsByDeck');
		// console.log('[decktracker-stats-loader] statsByDeck', statsByDeck);
		const deckstrings = Object.keys(statsByDeck);
		const decks: readonly DeckSummary[] = deckstrings
			.map(deckstring => this.buildDeckSummary(deckstring, statsByDeck[deckstring]))
			.sort(this.getSortFunction(filters.sort));

		return decks;
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
						return -1;
					}
					return 1;
				};
		}
	}

	private isValidDate(stat: GameStat, timeFilter: DeckTimeFilterType): boolean {
		switch (timeFilter) {
			case 'season-start':
				const startOfMonthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
				return stat.creationTimestamp >= startOfMonthDate.getTime();
			default:
				return true;
		}
	}

	private buildDeckSummary(deckstring: string, stats: readonly GameStat[]): DeckSummary {
		const deckName =
			stats.filter(stat => stat.playerDeckName).length > 0
				? stats.filter(stat => stat.playerDeckName)[0].playerDeckName
				: undefined;
		const deckSkin =
			stats.filter(stat => stat.playerCardId).length > 0
				? stats.filter(stat => stat.playerCardId)[0].playerCardId
				: undefined;
		const deckClass =
			stats.filter(stat => stat.playerClass).length > 0
				? stats.filter(stat => stat.playerClass)[0].playerClass
				: undefined;
		const totalGames = stats.length;
		const totalWins = stats.filter(stat => stat.result === 'won').length;
		const lastUsed = stats.filter(stat => stat.creationTimestamp)
			? stats.filter(stat => stat.creationTimestamp)[0].creationTimestamp
			: undefined;
		// const matchupStats: readonly MatchupStat[] = this.buildMatchupStats();
		return Object.assign(new DeckSummary(), {
			class: deckClass,
			deckName: deckName,
			deckstring: deckstring,
			lastUsedTimestamp: lastUsed,
			skin: deckSkin,
			totalGames: totalGames,
			winRatePercentage: (100.0 * totalWins) / totalGames,
			// matchupStats: matchupStats,
		} as DeckSummary);
	}
}

const groupBy = key => array =>
	array.reduce((objectsByKeyValue, obj) => {
		const value = obj[key];
		objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
		return objectsByKeyValue;
	}, {});
