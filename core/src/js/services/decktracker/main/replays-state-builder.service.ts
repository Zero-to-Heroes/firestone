/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { GroupedReplays } from '../../../models/mainwindow/replays/grouped-replays';
import { ReplaysFilter } from '../../../models/mainwindow/replays/replays-filter';
import { ReplaysFilterCategoryType } from '../../../models/mainwindow/replays/replays-filter-category.type';
import { ReplaysState } from '../../../models/mainwindow/replays/replays-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';

@Injectable()
export class ReplaysStateBuilderService {
	public buildState(replayState: ReplaysState, stats: StatsState): ReplaysState {
		if (!stats || !stats.gameStats || !stats.gameStats.stats) {
			console.error('Could not build replay state from empty stats', stats);
			return replayState;
		}
		const allReplays: readonly GameStat[] = [...stats.gameStats.stats];
		const groupedReplays: readonly GroupedReplays[] = this.groupReplays(allReplays, replayState.groupByCriteria);
		return Object.assign(new ReplaysState(), replayState, {
			allReplays: allReplays,
			groupedReplays: groupedReplays,
			isLoading: false,
		} as ReplaysState);
	}

	public filterReplays(replayState: ReplaysState, stats: StatsState, type: ReplaysFilterCategoryType, value: string) {
		// Update the filters
		// console.log('filtering replays', replayState, stats, type, value);
		const updatedFilters = this.updateFilters(replayState.filters, type, value);
		// console.log('updated filters', updatedFilters);
		const filteredStats: readonly GameStat[] = this.filterStats(stats, updatedFilters);
		// console.log('filtereallReplaysdStats', allReplays);
		const groupedReplays: readonly GroupedReplays[] = this.groupReplays(filteredStats, replayState.groupByCriteria);
		// console.log('groupedReplays', groupedReplays);
		return Object.assign(new ReplaysState(), replayState, {
			allReplays: filteredStats,
			groupedReplays: groupedReplays,
			filters: updatedFilters,
		} as ReplaysState);
	}

	private updateFilters(
		filters: readonly ReplaysFilter[],
		type: ReplaysFilterCategoryType,
		value: string,
	): readonly ReplaysFilter[] {
		return filters.map(filter =>
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
		return stats.gameStats.stats.filter(stat => this.isValidStat(stat, filters));
	}

	private isValidStat(stat: GameStat, filters: readonly ReplaysFilter[]): boolean {
		return filters.every(filter => filter.allows(stat));
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
		// console.log('[replays-state-builder] loaded replays by date');
		return Object.keys(replaysByDate).map(date => this.buildGroupedReplays(date, replaysByDate[date]));
	}

	private buildGroupedReplays(date: string, replays: readonly GameStat[]): GroupedReplays {
		return Object.assign(new GroupedReplays(), {
			header: date,
			replays: replays,
		} as GroupedReplays);
	}
}

const groupByFunction = (keyExtractor: (obj: object) => string) => array =>
	array.reduce((objectsByKeyValue, obj) => {
		const value = keyExtractor(obj);
		objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
		return objectsByKeyValue;
	}, {});
