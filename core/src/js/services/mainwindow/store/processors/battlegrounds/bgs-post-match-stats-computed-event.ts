import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { BgsPostMatchStatsComputedEvent } from '../../events/battlegrounds/bgs-post-match-stats-computed-event';
import { Processor } from '../processor';

export class BgsPostMatchStatsComputedProcessor implements Processor {
	constructor(private readonly replaysBuilder: ReplaysStateBuilderService) {}

	public async process(
		event: BgsPostMatchStatsComputedEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newStats = currentState.stats.update({
			bestBgsUserStats: event.newBestStats,
		} as StatsState);
		const statsAfterBgsUpdate: StatsState = newStats.updateBgsPostMatchStats(event.reviewId, event.postMatchStats);
		const replays = await this.replaysBuilder.buildState(
			currentState.replays,
			statsAfterBgsUpdate,
			currentState.decktracker.decks,
		);
		return [
			currentState.update({
				stats: statsAfterBgsUpdate,
				replays: replays,
			} as MainWindowState),
			null,
		];
	}
}
