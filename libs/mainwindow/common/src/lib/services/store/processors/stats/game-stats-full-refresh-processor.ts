import { GameStatsLoaderService } from '@firestone/stats/data-access';
import {
	GamesFullRefreshEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class GameStatsFullRefreshProcessor implements Processor {
	constructor(private readonly gamesLoaderService: GameStatsLoaderService) {}

	public async process(
		event: GamesFullRefreshEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.gamesLoaderService.fullRefresh();
		return [null, null];
	}
}
