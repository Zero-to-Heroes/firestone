import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { MatchStatsState } from '../../../../../models/mainwindow/stats/match-stats-state';
import { MinimizeMatchStatsWindowEvent } from '../../events/stats/minimize-match-stats-window-event';
import { Processor } from '../processor';

export class MinimizeMatchStatsWindowProcessor implements Processor {
	constructor() {}

	public async process(
		event: MinimizeMatchStatsWindowEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		const newState = Object.assign(new MatchStatsState(), currentState.matchStats, {
			minimized: true,
			maximized: false,
		} as MatchStatsState);
		return Object.assign(new MainWindowState(), currentState, {
			matchStats: newState,
		} as MainWindowState);
	}
}
