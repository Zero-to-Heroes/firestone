import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { DecktrackerStateLoaderService } from '../../../../decktracker/main/decktracker-state-loader.service';
import { Events } from '../../../../events.service';
import { RecomputeGameStatsEvent } from '../../events/stats/recompute-game-stats-event';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(private decktrackerStateLoader: DecktrackerStateLoaderService, private readonly events: Events) {}

	public async process(
		event: RecomputeGameStatsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[recompute-game-stats-processor] starting process');
		const newGameStats: GameStats = event.gameStats;
		this.events.broadcast(Events.MATCH_STATS_UPDATED, newGameStats);
		const newStatsState: StatsState = Object.assign(new StatsState(), currentState.stats, {
			gameStats: newGameStats,
		} as StatsState);
		console.log('[recompute-game-stats-processor] newStatsState');
		const decktracker: DecktrackerState = this.decktrackerStateLoader.buildState(
			currentState.decktracker,
			newStatsState,
		);
		console.log('[recompute-game-stats-processor] decktracker');
		return [
			Object.assign(new MainWindowState(), currentState, {
				stats: newStatsState,
				decktracker: decktracker,
			} as MainWindowState),
			null,
		];
	}
}
