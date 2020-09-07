import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { BgsPostMatchStatsComputedEvent } from '../../events/battlegrounds/bgs-post-match-stats-computed-event';
import { Processor } from '../processor';

export class BgsPostMatchStatsComputedProcessor implements Processor {
	public async process(
		event: BgsPostMatchStatsComputedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newStats = currentState.stats.update({
			bestBgsUserStats: event.newBestStats,
		} as StatsState);
		return [
			currentState.update({
				stats: newStats,
			} as MainWindowState),
			null,
		];
	}
}
