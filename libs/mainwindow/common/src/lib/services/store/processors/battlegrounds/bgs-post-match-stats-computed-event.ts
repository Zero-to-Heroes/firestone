import { GameStatsLoaderService } from '@firestone/stats/data-access';
import {
	BgsPostMatchStatsComputedEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class BgsPostMatchStatsComputedProcessor implements Processor {
	constructor(private readonly gameStats: GameStatsLoaderService) {}

	public async process(
		event: BgsPostMatchStatsComputedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.gameStats.updateBgsPostMatchStats(event.reviewId, event.postMatchStats);
		return [null, null];
	}
}
