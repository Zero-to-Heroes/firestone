import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { GamesFullRefreshEvent } from '../../events/stats/game-stats-full-refresh-event';
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
