import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { BgsBestUserStatsInitEvent } from '../../events/stats/bgs-best-user-stats-init-event';
import { Processor } from '../processor';

export class BgsBestUserStatsInitProcessor implements Processor {
	public async process(
		event: BgsBestUserStatsInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newStatsState = currentState.stats.update({
			bestBgsUserStats: event.bgsStats,
		} as StatsState);
		// console.log('updated stats state with bgs best stats', newStatsState);
		return [
			currentState.update({
				stats: newStatsState,
			} as MainWindowState),
			null,
		];
	}
}
