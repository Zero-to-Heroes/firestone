import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { GameStatsLoaderService } from '../../../../stats/game/game-stats-loader.service';
import { GamesFullClearEvent } from '../../events/stats/game-stats-full-clear-event';
import { Processor } from '../processor';

export class GameStatsFullClearProcessor implements Processor {
	constructor(private readonly gamesLoaderService: GameStatsLoaderService) {}

	public async process(
		event: GamesFullClearEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		this.gamesLoaderService.clearGames();
		return [null, null];
	}
}
