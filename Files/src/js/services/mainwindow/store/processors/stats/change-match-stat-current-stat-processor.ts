import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { MatchStatsState } from '../../../../../models/mainwindow/stats/match-stats-state';
import { ChangeMatchStatCurrentStatEvent } from '../../events/stats/change-match-stat-current-stat-event';
import { Processor } from '../processor';

export class ChangeMatchStatCurrentStatProcessor implements Processor {
	constructor() {}

	public async process(
		event: ChangeMatchStatCurrentStatEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		const newState = Object.assign(new MatchStatsState(), currentState.matchStats, {
			currentStat: event.newStat,
		} as MatchStatsState);
		return Object.assign(new MainWindowState(), currentState, {
			matchStats: newState,
		} as MainWindowState);
	}
}
