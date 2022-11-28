import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MercenariesGlobalStatsLoadedEvent } from '../../events/mercenaries/mercenaries-global-stats-loaded-event';

export class MercenariesGlobalStatsLoadedProcessor implements Processor {
	public async process(
		event: MercenariesGlobalStatsLoadedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.debug('setting stats', event.stats, event.stats === undefined);
		const newState = currentState.update({
			mercenaries: currentState.mercenaries.update({
				globalStats: event.stats,
			}),
		});
		console.debug('newState', newState, currentState, event.stats);
		return [newState, null];
	}
}
