import { DuelsState } from '../../../../../models/duels/duels-state';
import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { BgsBuilderService } from '../../../../battlegrounds/bgs-builder.service';
import { DecktrackerStateLoaderService } from '../../../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { DuelsStateBuilderService } from '../../../../duels/duels-state-builder.service';
import { Events } from '../../../../events.service';
import { PreferencesService } from '../../../../preferences.service';
import { RecomputeGameStatsEvent } from '../../events/stats/recompute-game-stats-event';
import { Processor } from '../processor';

export class RecomputeGameStatsProcessor implements Processor {
	constructor(
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly bgsBuilder: BgsBuilderService,
		private readonly duelsBuilder: DuelsStateBuilderService,
		private readonly events: Events,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: RecomputeGameStatsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[recompute-game-stats-processor] starting process');
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
			currentState.decktracker.patch,
			prefs,
		);
		console.log('[recompute-game-stats-processor] decktracker');
		const replayState: ReplaysState = await this.replaysStateBuilder.buildState(
			currentState.replays,
			newStatsState,
			decktracker.decks,
		);
		console.log('[recompute-game-stats-processor] newStatsState');

		// Rebuild stats for battlegrounds state
		const battlegrounds: BattlegroundsAppState = await this.bgsBuilder.updateStats(
			currentState.battlegrounds,
			newGameStats,
			currentState.battlegrounds.stats?.currentBattlegroundsMetaPatch,
		);
		console.log('[recompute-game-stats-processor] battlegrounds');

		const duels: DuelsState = await this.duelsBuilder.updateState(
			currentState.duels,
			newGameStats,
			currentState.binder,
		);
		console.log('[recompute-game-stats-processor] duels');

		return [
			Object.assign(new MainWindowState(), currentState, {
				stats: newStatsState,
				decktracker: decktracker,
				replays: replayState,
				battlegrounds: battlegrounds,
				duels: duels,
			} as MainWindowState),
			null,
		];
	}
}
