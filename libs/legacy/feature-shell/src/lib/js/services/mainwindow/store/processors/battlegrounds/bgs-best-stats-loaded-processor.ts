import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { BgsBestStatsLoadedEvent } from '../../events/battlegrounds/bgs-best-stats-loaded-event';

export class BgsBestStatsLoadedProcessor implements Processor {
	public async process(
		event: BgsBestStatsLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			stats: currentState.stats.update({
				bestBgsUserStats: event.stats,
			}),
		});
		return [newState, null];
	}
}
