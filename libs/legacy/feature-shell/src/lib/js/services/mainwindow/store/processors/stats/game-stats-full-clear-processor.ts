import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { GamesFullClearEvent } from '@firestone/mainwindow/common';
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
