import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { GlobalStatsLoadedEvent } from '../../../events/stats/global/global-stats-loaded-event';

export class GlobalStatsLoadedProcessor implements Processor {
	public async process(
		event: GlobalStatsLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState = currentState.update({
			globalStats: event.stats,
		});
		return [newState, null];
	}
}
