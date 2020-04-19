import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { RecomputeReplaysEvent } from '../../events/replays/recompute-replays-event';
import { Processor } from '../processor';

export class RecomputeReplaysProcessor implements Processor {
	constructor(private replaysStateBuilder: ReplaysStateBuilderService) {}

	public async process(
		event: RecomputeReplaysEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[recompute-replays-processor] starting process');
		const newGameStats: GameStats = event.gameStats;
		const newStatsState: StatsState = Object.assign(new StatsState(), currentState.stats, {
			gameStats: newGameStats,
		} as StatsState);
		const replayState: ReplaysState = this.replaysStateBuilder.buildState(currentState.replays, newStatsState);
		console.log('[recompute-replays-processor] replayState');
		return [
			Object.assign(new MainWindowState(), currentState, {
				replays: replayState,
			} as MainWindowState),
			null,
		];
	}
}
