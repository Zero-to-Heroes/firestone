/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { GroupedReplays } from '../../../models/mainwindow/replays/grouped-replays';
import { ReplaysFilter } from '../../../models/mainwindow/replays/replays-filter';
import { ReplaysFilterCategoryType } from '../../../models/mainwindow/replays/replays-filter-category.type';
import { ReplaysState } from '../../../models/mainwindow/replays/replays-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { Preferences } from '../../../models/preferences';
import { PreferencesService } from '../../preferences.service';
import { groupByFunction } from '../../utils';

@Injectable()
export class ReplaysStateBuilderService {
	constructor(private readonly prefs: PreferencesService, private readonly allCards: CardsFacadeService) {}

	public async buildState(
		replayState: ReplaysState,
		stats: StatsState,
		decks: readonly DeckSummary[],
	): Promise<ReplaysState> {
		if (!stats || !stats.gameStats || !stats.gameStats.stats) {
			console.error('Could not build replay state from empty stats', stats);
			return replayState;
		}
		const allReplays: readonly GameStat[] = [...stats.gameStats.stats];
		const groupedReplays: readonly GroupedReplays[] = this.groupReplays(allReplays, replayState.groupByCriteria);
		const state = Object.assign(new ReplaysState(), replayState, {
			allReplays: allReplays,
			groupedReplays: groupedReplays,
			isLoading: false,
			filters: ReplaysState.buildFilters(decks, this.allCards),
		} as ReplaysState);
		const stateWithFilters = await this.filterReplays(state, stats);
		return stateWithFilters;
	}

	// Update the filters
	public async filterReplays(replayState: ReplaysState, stats: StatsState): Promise<ReplaysState> {
		const prefs = await this.prefs.getPreferences();
		const allFilters: readonly FilterValue[] = this.buildReplayFilters(prefs);

		let updatedFilters = replayState.filters;
		for (const filter of allFilters) {
			updatedFilters = this.updateFilters(updatedFilters, filter.type, filter.value);
		}

		const filteredStats: readonly GameStat[] = this.filterStats(stats, updatedFilters);

		const groupedReplays: readonly GroupedReplays[] = this.groupReplays(filteredStats, replayState.groupByCriteria);

		return Object.assign(new ReplaysState(), replayState, {
			allReplays: filteredStats,
			groupedReplays: groupedReplays,
			filters: updatedFilters,
		} as ReplaysState);
	}

	private buildReplayFilters(prefs: Preferences): readonly FilterValue[] {
		return [
			{
				type: 'deckstring',
				value: prefs.replaysFilterDeckstring,
			},
			{
				type: 'gameMode',
				value: prefs.replaysFilterGameMode,
			},
			{
				type: 'bg-hero',
				value: prefs.replaysFilterBgHero,
			},
			{
				type: 'player-class',
				value: prefs.replaysFilterPlayerClass,
			},
			{
				type: 'opponent-class',
				value: prefs.replaysFilterOpponentClass,
			},
		];
	}

	private updateFilters(
		filters: readonly ReplaysFilter[],
		type: ReplaysFilterCategoryType,
		value: string,
	): readonly ReplaysFilter[] {
		return filters.map((filter) =>
			filter.type === type
				? Object.assign(
						filter.update({
							selectedOption: value,
						} as ReplaysFilter),
				  )
				: filter,
		);
	}

	private filterStats(stats: StatsState, filters: readonly ReplaysFilter[]): readonly GameStat[] {
		return stats.gameStats.stats.filter((stat) => this.isValidStat(stat, filters));
	}

	private isValidStat(stat: GameStat, filters: readonly ReplaysFilter[]): boolean {
		return filters.every((filter) => filter.allows(stat));
	}

	private groupReplays(allReplays: readonly GameStat[], groupByCriteria: string): readonly GroupedReplays[] {
		const groupingFunction = (replay: GameStat) => {
			const date = new Date(replay.creationTimestamp);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const replaysByDate = groupByDate(allReplays);

		return Object.keys(replaysByDate).map((date) => this.buildGroupedReplays(date, replaysByDate[date]));
	}

	private buildGroupedReplays(date: string, replays: readonly GameStat[]): GroupedReplays {
		return Object.assign(new GroupedReplays(), {
			header: date,
			replays: replays,
		} as GroupedReplays);
	}
}

interface FilterValue {
	readonly type: ReplaysFilterCategoryType;
	readonly value: string;
}
