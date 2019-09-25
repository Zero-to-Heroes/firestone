import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { MatchStats } from '../../../../../models/mainwindow/stats/match-stats';
import { MatchStatsState } from '../../../../../models/mainwindow/stats/match-stats-state';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { ShowMatchStatsEvent } from '../../events/stats/show-match-stats-event';
import { Processor } from '../processor';

export class ShowMatchStatsProcessor implements Processor {
	constructor() {}

	public async process(event: ShowMatchStatsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		console.log('showmatchstatsevent', event);
		const matchStat: MatchStats = this.findMatchStat(currentState.stats, event.reviewId);
		const newState = Object.assign(new MatchStatsState(), currentState.matchStats, {
			visible: true,
			matchStats: matchStat,
			currentStat: 'replay',
		} as MatchStatsState);
		console.log('showing match stats', event, newState);
		return Object.assign(new MainWindowState(), currentState, {
			matchStats: newState,
		} as MainWindowState);
	}

	private findMatchStat(stats: StatsState, reviewId: string): MatchStats {
		return stats.gameStats.stats.find(stat => stat.matchStat && stat.matchStat.reviewId === reviewId).matchStat;
	}
}
