import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { DecktrackerStateLoaderService } from '../../../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { RecomputeGameStatsEvent } from '../../events/stats/recompute-game-stats-event';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(
		private decktrackerStateLoader: DecktrackerStateLoaderService,
		private replaysStateBuilder: ReplaysStateBuilderService,
	) {}

	public async process(event: RecomputeGameStatsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		console.log('[recompute-game-stats-processor] starting process');
		const newGameStats: GameStats = event.gameStats;
		const newStatsState: StatsState = Object.assign(new StatsState(), currentState.stats, {
			gameStats: newGameStats,
		} as StatsState);
		console.log('[recompute-game-stats-processor] newStatsState');
		const decktracker: DecktrackerState = this.decktrackerStateLoader.buildState(
			currentState.decktracker,
			newStatsState,
		);
		console.log('[recompute-game-stats-processor] decktracker');
		const replayState: ReplaysState = this.replaysStateBuilder.buildState(currentState.replays, newStatsState);
		console.log('[recompute-game-stats-processor] replayState');
		return Object.assign(new MainWindowState(), currentState, {
			stats: newStatsState,
			decktracker: decktracker,
			replays: replayState,
		} as MainWindowState);
	}
}
