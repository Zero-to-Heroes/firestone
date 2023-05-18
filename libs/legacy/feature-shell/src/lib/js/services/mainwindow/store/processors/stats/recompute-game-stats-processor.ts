import { GameStat } from '@firestone/stats/data-access';
import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { DecktrackerStateLoaderService } from '../../../../decktracker/main/decktracker-state-loader.service';
import { Events } from '../../../../events.service';
import { PreferencesService } from '../../../../preferences.service';
import { RecomputeGameStatsEvent } from '../../events/stats/recompute-game-stats-event';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly events: Events,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: RecomputeGameStatsEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		// console.log('[recompute-game-stats-processor] starting process');
		const newGameStats: GameStats = currentState.stats.gameStats.update({
			stats: [event.gameStat, ...currentState.stats.gameStats.stats] as readonly GameStat[],
		} as GameStats);
		this.events.broadcast(Events.GAME_STATS_UPDATED, newGameStats);
		const newStatsState: StatsState = Object.assign(new StatsState(), currentState.stats, {
			gameStats: newGameStats,
		} as StatsState);

		const prefs = await this.prefs.getPreferences();
		const decktracker: DecktrackerState = this.decktrackerStateLoader.buildState(
			currentState.decktracker,
			newStatsState,
			currentState.decktracker.config,
			currentState.decktracker.patch,
			prefs,
		);

		return [
			currentState.update({
				stats: newStatsState,
				decktracker: decktracker,
			} as MainWindowState),
			null,
		];
	}
}
