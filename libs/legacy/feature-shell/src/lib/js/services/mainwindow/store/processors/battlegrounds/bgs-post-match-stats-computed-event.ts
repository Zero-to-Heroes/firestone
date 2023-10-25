import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { GameStatsLoaderService } from '../../../../stats/game/game-stats-loader.service';
import { BgsPostMatchStatsComputedEvent } from '../../events/battlegrounds/bgs-post-match-stats-computed-event';
import { Processor } from '../processor';

export class BgsPostMatchStatsComputedProcessor implements Processor {
	constructor(private readonly gameStats: GameStatsLoaderService) {}

	public async process(
		event: BgsPostMatchStatsComputedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newStats = currentState.stats.update({
			bestBgsUserStats: event.newBestStats,
		} as StatsState);
		this.gameStats.updateBgsPostMatchStats(event.reviewId, event.postMatchStats);
		return [
			currentState.update({
				stats: newStats,
			} as MainWindowState),
			null,
		];
	}
}
