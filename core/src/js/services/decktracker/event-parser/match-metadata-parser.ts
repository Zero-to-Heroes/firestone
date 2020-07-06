import { GameFormat } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { Metadata } from '../../../models/decktracker/metadata';
import { StatsRecap } from '../../../models/decktracker/stats-recap';
import { GameEvent } from '../../../models/game-event';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { EventParser } from './event-parser';

export class MatchMetadataParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MATCH_METADATA;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const stats: StatsState = gameEvent.additionalData?.stats;
		const format = gameEvent.additionalData.metaData.FormatType as number;
		const convertedFormat = MatchMetadataParser.convertFormat(format);
		const deckStats: readonly GameStat[] =
			!currentState.playerDeck?.deckstring || !stats?.gameStats
				? []
				: stats.gameStats.stats
						.filter(stat => stat.gameMode === 'ranked')
						.filter(stat => stat.playerDecklist === currentState.playerDeck?.deckstring)
						.filter(stat => stat.gameFormat === convertedFormat) || [];
		const statsRecap: StatsRecap = StatsRecap.from(deckStats, convertedFormat);
		console.log('match metadata', deckStats, convertedFormat, format, stats);
		let matchupStatsRecap = currentState.matchupStatsRecap;
		if (currentState?.opponentDeck?.hero?.playerClass) {
			const statsAgainstOpponent = currentState.deckStats.filter(
				stat => stat.opponentClass === currentState?.opponentDeck?.hero.playerClass,
			);
			matchupStatsRecap = StatsRecap.from(
				statsAgainstOpponent,
				convertedFormat,
				currentState?.opponentDeck?.hero.playerClass,
			);
			console.log('opponent present', matchupStatsRecap, currentState);
		}
		return Object.assign(new GameState(), currentState, {
			metadata: {
				gameType: gameEvent.additionalData.metaData.GameType as number,
				formatType: format,
				scenarioId: gameEvent.additionalData.metaData.ScenarioID as number,
			} as Metadata,
			deckStats: deckStats,
			deckStatsRecap: statsRecap,
			matchupStatsRecap: matchupStatsRecap,
		} as GameState);
	}

	event(): string {
		return GameEvent.MATCH_METADATA;
	}

	public static convertFormat(format: number): StatGameFormatType {
		if (format === GameFormat.FT_WILD) {
			return 'wild';
		} else if (format === GameFormat.FT_STANDARD) {
			return 'standard';
		} else {
			return 'unknown';
		}
	}
}
