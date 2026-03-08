import { GameStatsLoaderService } from '@firestone/stats/data-access';
import {
	MainWindowState,
	NavigationState,
	RecomputeGameStatsEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(private readonly gameStats: GameStatsLoaderService) {}

	public async process(
		event: RecomputeGameStatsEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.gameStats.addGame(event.gameStat);
		return [null, null];
	}
}
