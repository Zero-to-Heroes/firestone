import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { GameStatsUpdaterService } from '../../../../stats/game/game-stats-updater.service';
import { RecomputeGameStatsEvent } from '../../events/stats/recompute-game-stats-event';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(private gameStatsUpdater: GameStatsUpdaterService) {}

	public async process(event: RecomputeGameStatsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newGameStats: GameStats = this.gameStatsUpdater.recomputeGameStats(currentState.stats.gameStats);
		const newStatsState: StatsState = Object.assign(new StatsState(), currentState.stats, {
			gameStats: newGameStats,
		} as StatsState);
		return Object.assign(new MainWindowState(), currentState, {
			stats: newStatsState,
		} as MainWindowState);
	}
}
