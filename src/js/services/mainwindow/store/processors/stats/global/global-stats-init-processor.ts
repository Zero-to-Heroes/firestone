import { MainWindowState } from '../../../../../../models/mainwindow/main-window-state';
import { GlobalStats } from '../../../../../../models/mainwindow/stats/global/global-stats';
import { GlobalStatsInitEvent } from '../../../events/stats/global/global-stats-init-event';
import { Processor } from '../../processor';

export class GlobalStatsInitProcessor implements Processor {
	constructor() {}

	public async process(event: GlobalStatsInitEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const stats = Object.assign(new GlobalStats(), currentState.globalStats, event.newState);
		return Object.assign(new MainWindowState(), currentState, {
			globalStats: stats,
		} as MainWindowState);
	}
}
