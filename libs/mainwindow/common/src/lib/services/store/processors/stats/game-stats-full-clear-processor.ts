import { GameStatsLoaderService } from '@firestone/stats/data-access';
import {
	GamesFullClearEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class GameStatsFullClearProcessor implements Processor {
	constructor(private readonly gamesLoaderService: GameStatsLoaderService) {}

	public async process(
		event: GamesFullClearEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.gamesLoaderService.clearGames();
		return [null, null];
	}
}
