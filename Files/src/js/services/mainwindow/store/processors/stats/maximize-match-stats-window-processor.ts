import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { MatchStatsState } from '../../../../../models/mainwindow/stats/match-stats-state';
import { MaximizeMatchStatsWindowEvent } from '../../events/stats/maximize-match-stats-window-event';
import { Processor } from '../processor';

export class MaximizeMatchStatsWindowProcessor implements Processor {
	constructor() {}

	public async process(
		event: MaximizeMatchStatsWindowEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		const newState = Object.assign(new MatchStatsState(), currentState.matchStats, {
			maximized: !currentState.matchStats.maximized,
			minimized: false,
		} as MatchStatsState);
		return Object.assign(new MainWindowState(), currentState, {
			matchStats: newState,
		} as MainWindowState);
	}
}
