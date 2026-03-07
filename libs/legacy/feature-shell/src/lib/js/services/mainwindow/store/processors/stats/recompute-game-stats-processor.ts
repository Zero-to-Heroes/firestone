import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { RecomputeGameStatsEvent } from '@firestone/mainwindow/common';
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
