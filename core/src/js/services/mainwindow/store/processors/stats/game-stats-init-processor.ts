import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ReplaysState } from '../../../../../models/mainwindow/replays/replays-state';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { DecktrackerStateLoaderService } from '../../../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../../../decktracker/main/replays-state-builder.service';
import { GameStatsInitEvent } from '../../events/stats/game-stats-init-event';
import { Processor } from '../processor';

export class GameStatsInitProcessor implements Processor {
	constructor(
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
	) {}

	public async process(
		event: GameStatsInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newStatsState = currentState.stats.update({
			gameStats: event.newGameStats,
		} as StatsState);
		const replayState: ReplaysState = this.replaysStateBuilder.buildState(currentState.replays, newStatsState);
		const decktracker = this.decktrackerStateLoader.buildState(currentState.decktracker, newStatsState);
		return [
			Object.assign(new MainWindowState(), currentState, {
				stats: newStatsState,
				replays: replayState,
				decktracker: decktracker,
			} as MainWindowState),
			null,
		];
	}
}
