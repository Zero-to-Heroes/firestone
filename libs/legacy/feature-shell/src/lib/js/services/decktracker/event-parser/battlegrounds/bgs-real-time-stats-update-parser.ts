import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsPanel, BgsPostMatchStatsPanel, GameState, RealTimeStatsState } from '@firestone/game-state';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsRealTimeStatsUpdateParser implements EventParser {
	constructor(private readonly i18n: ILocalizationService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const realTimeStatsState = gameEvent.additionalData.stats;
		const panels: readonly BgsPanel[] = currentState.bgState.panels.map((panel) =>
			panel.id === 'bgs-post-match-stats' ? this.updatePostMatch(panel, currentState, realTimeStatsState) : panel,
		);
		const newGame = currentState.bgState.currentGame.update({
			liveStats: realTimeStatsState,
		});
		return currentState.update({
			bgState: currentState.bgState.update({
				panels: panels,
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_REAL_TIME_STATS_UPDATE;
	}

	private updatePostMatch(
		panel: BgsPanel,
		currentState: GameState,
		realTimeStatsState: RealTimeStatsState,
	): BgsPostMatchStatsPanel {
		const mainPlayer = currentState.bgState.currentGame.getMainPlayer();
		const triples =
			mainPlayer && realTimeStatsState.triplesPerHero[mainPlayer.playerId]
				? new Array(realTimeStatsState.triplesPerHero[mainPlayer.playerId])
				: [];
		return (panel as BgsPostMatchStatsPanel).update({
			stats: {
				...realTimeStatsState,
				tripleTimings: triples,
			} as IBgsPostMatchStats,
			player: mainPlayer,
			name: this.i18n.translateString('battlegrounds.post-match-stats.live-stats-title', {
				turn: currentState.currentTurnNumeric,
			}),
		} as BgsPostMatchStatsPanel);
	}
}
