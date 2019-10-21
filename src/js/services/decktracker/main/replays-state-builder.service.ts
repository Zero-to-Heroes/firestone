/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DeckReplayInfo } from '../../../models/mainwindow/decktracker/deck-replay-info';
import { GroupedReplays } from '../../../models/mainwindow/decktracker/grouped-replays';
import { ReplaysState } from '../../../models/mainwindow/decktracker/replays-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';

@Injectable()
export class ReplaysStateBuilderService {
	constructor(private readonly logger: NGXLogger) {}

	public buildState(replayState: ReplaysState, stats: StatsState): ReplaysState {
		const allReplays: readonly DeckReplayInfo[] = this.buildReplayInfos(stats.gameStats.stats);
		const groupedReplays: readonly GroupedReplays[] = this.groupReplays(allReplays, replayState.groupByCriteria);
		return Object.assign(new ReplaysState(), replayState, {
			allReplays: allReplays,
			groupedReplays: groupedReplays,
		} as ReplaysState);
	}

	private groupReplays(allReplays: readonly DeckReplayInfo[], groupByCriteria: string): readonly GroupedReplays[] {
		const groupingFunction = (replay: DeckReplayInfo) => {
			const date = new Date(replay.creationTimestamp);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const replaysByDate = groupByDate(allReplays);
		this.logger.debug('[replays-state-builder] replays by date', replaysByDate);
		return Object.keys(replaysByDate).map(date => this.buildGroupedReplays(date, replaysByDate[date]));
	}

	private buildGroupedReplays(date: string, replays: readonly DeckReplayInfo[]): GroupedReplays {
		return Object.assign(new GroupedReplays(), {
			header: date,
			replays: replays,
		} as GroupedReplays);
	}

	private buildReplayInfos(stats: readonly GameStat[]): readonly DeckReplayInfo[] {
		const rankedStats = stats.filter(stat => stat.gameMode === 'ranked');
		return rankedStats.map(stat => this.buildReplayInfo(stat));
	}

	private buildReplayInfo(stat: GameStat): DeckReplayInfo {
		return Object.assign(new DeckReplayInfo(), {
			coinPlay: stat.coinPlay,
			creationTimestamp: stat.creationTimestamp,
			opponentClass: stat.opponentClass,
			opponentName: stat.opponentName,
			opponentSkin: stat.opponentCardId,
			playerName: stat.playerName,
			playerClass: stat.playerClass,
			playerDeckName: stat.playerDeckName,
			playerRank: stat.playerRank,
			playerSkin: stat.playerCardId,
			result: stat.result,
			reviewId: stat.reviewId,
		} as DeckReplayInfo);
	}
}

const groupByFunction = (keyExtractor: (obj: object) => string) => array =>
	array.reduce((objectsByKeyValue, obj) => {
		const value = keyExtractor(obj);
		objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
		return objectsByKeyValue;
	}, {});
