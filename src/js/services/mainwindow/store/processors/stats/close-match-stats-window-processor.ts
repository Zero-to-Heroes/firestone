import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { MatchStatsState } from '../../../../../models/mainwindow/stats/match-stats-state';
import { CloseMatchStatsWindowEvent } from '../../events/stats/close-match-stats-window-event';
import { Processor } from '../processor';

export class CloseMatchStatsWindowProcessor implements Processor {
	constructor() {}

	public async process(event: CloseMatchStatsWindowEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newState = Object.assign(new MatchStatsState(), currentState.matchStats, {
			visible: false,
			minimized: false,
			maximized: false,
		} as MatchStatsState);
		return Object.assign(new MainWindowState(), currentState, {
			matchStats: newState,
		} as MainWindowState);
	}
}
