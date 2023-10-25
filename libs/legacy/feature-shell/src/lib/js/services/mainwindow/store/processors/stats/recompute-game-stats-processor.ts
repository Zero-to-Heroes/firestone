import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { GameStatsLoaderService } from '../../../../stats/game/game-stats-loader.service';
import { RecomputeGameStatsEvent } from '../../events/stats/recompute-game-stats-event';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(private readonly gameStats: GameStatsLoaderService) {}

	public async process(
		event: RecomputeGameStatsEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		this.gameStats.addGame(event.gameStat);
		return [null, null];
	}
}
