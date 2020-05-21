/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';

@Injectable()
export class DecksStateBuilderService {
	public buildState(stats: StatsState, filters: DeckFilters): readonly DeckSummary[] {
		// console.log('[decktracker-stats-loader] update with stats');
		if (!stats || !stats.gameStats) {
			return [];
		}
		const standardRanked = stats.gameStats.stats
			.filter(stat => stat.gameFormat === filters.gameFormat)
			.filter(stat => stat.gameMode === filters.gameMode)
			.filter(stat => stat.playerDecklist && stat.playerDecklist !== 'undefined');
		const groupByDeckstring = groupBy('playerDecklist');
		const statsByDeck = groupByDeckstring(standardRanked);
		// console.log('[decktracker-stats-loader] statsByDeck');
		// console.log('[decktracker-stats-loader] statsByDeck', statsByDeck);
		const deckstrings = Object.keys(statsByDeck);
		const decks: readonly DeckSummary[] = deckstrings.map(deckstring =>
			this.buildDeckSummary(deckstring, statsByDeck[deckstring]),
		);
		return decks;
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
