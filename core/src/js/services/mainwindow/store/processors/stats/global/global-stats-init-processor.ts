import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../../models/mainwindow/navigation/navigation-state';
import { GlobalStatsInitEvent } from '../../../events/stats/global/global-stats-init-event';
import { Processor } from '../../processor';

export class GlobalStatsInitProcessor implements Processor {
	public async process(
		event: GlobalStatsInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const stats = Object.assign(new GlobalStats(), currentState.globalStats, event.newState);
		return [
			Object.assign(new MainWindowState(), currentState, {
				globalStats: stats,
			} as MainWindowState),
			null,
		];
	}
}
