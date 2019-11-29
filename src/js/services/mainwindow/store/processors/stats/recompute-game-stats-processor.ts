import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { DecktrackerStateLoaderService } from '../../../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { GameStatsUpdaterService } from '../../../../stats/game/game-stats-updater.service';
import { RecomputeGameStatsEvent } from '../../events/stats/recompute-game-stats-event';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(
		private gameStatsUpdater: GameStatsUpdaterService,
		private decktrackerStateLoader: DecktrackerStateLoaderService,
		private replaysStateBuilder: ReplaysStateBuilderService,
	) {}

	public async process(event: RecomputeGameStatsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newGameStats: GameStats = await this.gameStatsUpdater.recomputeGameStats(
			currentState.stats.gameStats,
			event.reviewId,
		);
		const newStatsState: StatsState = Object.assign(new StatsState(), currentState.stats, {
			gameStats: newGameStats,
		} as StatsState);
		const decktracker: DecktrackerState = this.decktrackerStateLoader.buildState(
			currentState.decktracker,
			newStatsState,
		);
		const replayState: ReplaysState = this.replaysStateBuilder.buildState(currentState.replays, newStatsState);
		return Object.assign(new MainWindowState(), currentState, {
			stats: newStatsState,
			decktracker: decktracker,
			replays: replayState,
		} as MainWindowState);
	}
}
