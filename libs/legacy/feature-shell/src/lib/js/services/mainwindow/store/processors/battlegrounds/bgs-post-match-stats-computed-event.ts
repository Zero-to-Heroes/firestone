import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
import { BgsPostMatchStatsComputedEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class BgsPostMatchStatsComputedProcessor implements Processor {
	constructor(private readonly gameStats: GameStatsLoaderService) {}

	public async process(
		event: BgsPostMatchStatsComputedEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.gameStats.updateBgsPostMatchStats(event.reviewId, event.postMatchStats);
		return [null, null];
	}
}
