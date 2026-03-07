import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { GamesFullRefreshEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class GameStatsFullRefreshProcessor implements Processor {
	constructor(private readonly gamesLoaderService: GameStatsLoaderService) {}

	public async process(
		event: GamesFullRefreshEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		this.gamesLoaderService.fullRefresh();
		return [null, null];
	}
}
