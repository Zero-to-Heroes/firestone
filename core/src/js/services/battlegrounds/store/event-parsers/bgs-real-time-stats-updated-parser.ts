import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsPostMatchStage } from '../../../../models/battlegrounds/post-match/bgs-post-match-stage';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsRealTimeStatsUpdatedEvent } from '../events/bgs-real-time-stats-updated-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { RealTimeStatsState } from '../real-time-stats/real-time-stats';
import { EventParser } from './_event-parser';

export class BgsRealTimeStatsUpdatedParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRealTimeStatsUpdatedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsRealTimeStatsUpdatedEvent,
	): Promise<BattlegroundsState> {
		const postMatchStage: BgsPostMatchStage = currentState.stages.find(
			(stage) => stage.id === 'post-match',
		) as BgsPostMatchStage;
		const panels: readonly BgsPanel[] = postMatchStage.panels.map((panel) =>
			panel.id === 'bgs-post-match-stats'
				? this.updatePostMatch(panel, currentState, event.realTimeStatsState)
				: panel,
		);
		const stages: readonly BgsStage[] = currentState.stages.map((stage) =>
			stage.id === postMatchStage.id
				? postMatchStage.update({
						panels: panels,
				  } as BgsPostMatchStage)
				: stage,
		);
		const newGame = currentState.currentGame.update({
			liveStats: event.realTimeStatsState,
		} as BgsGame);
		return currentState.update({
			stages: stages,
			currentGame: newGame,
		} as BattlegroundsState);
	}

	private updatePostMatch(
		panel: BgsPanel,
		currentState: BattlegroundsState,
		realTimeStatsState: RealTimeStatsState,
	): BgsPostMatchStatsPanel {
		const mainPlayer = currentState.currentGame.getMainPlayer();
		const triples =
			mainPlayer && realTimeStatsState.triplesPerHero[mainPlayer.cardId]
				? new Array(realTimeStatsState.triplesPerHero[mainPlayer.cardId])
				: [];
		return (panel as BgsPostMatchStatsPanel).update({
			stats: {
				...realTimeStatsState,
				tripleTimings: triples,
			} as IBgsPostMatchStats,
			player: mainPlayer,
			name: `Live stats - Turn ${currentState.currentGame.currentTurn}`,
		} as BgsPostMatchStatsPanel);
	}
}
