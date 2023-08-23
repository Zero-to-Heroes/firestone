import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsRealTimeStatsUpdatedEvent } from '../events/bgs-real-time-stats-updated-event';
import { RealTimeStatsState } from '../real-time-stats/real-time-stats';
import { EventParser } from './_event-parser';

export class BgsRealTimeStatsUpdatedParser implements EventParser {
	constructor(private readonly i18n: LocalizationFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRealTimeStatsUpdatedEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsRealTimeStatsUpdatedEvent,
	): Promise<BattlegroundsState> {
		const panels: readonly BgsPanel[] = currentState.panels.map((panel) =>
			panel.id === 'bgs-post-match-stats'
				? this.updatePostMatch(panel, currentState, event.realTimeStatsState)
				: panel,
		);
		const newGame = currentState.currentGame.update({
			liveStats: event.realTimeStatsState,
		} as BgsGame);
		return currentState.update({
			panels: panels,
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
				turn: currentState.currentGame.currentTurn,
			}),
		} as BgsPostMatchStatsPanel);
	}
}
