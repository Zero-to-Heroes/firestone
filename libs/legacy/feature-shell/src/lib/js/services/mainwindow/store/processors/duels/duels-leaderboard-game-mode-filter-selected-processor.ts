import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DuelsLeaderboardGameModeFilterSelectedEvent } from '../../events/duels/duels-leaderboard-game-mode-filter-selected-event';
import { Processor } from '../processor';

export class DuelsLeaderboardGameModeFilterSelectedProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: DuelsLeaderboardGameModeFilterSelectedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		await this.prefs.updateDuelsLeaderboardGameModeFilter(event.value);
		// const duels = currentState.duels.update({
		// 	activeLeaderboardModeFilter: event.value,
		// } as DuelsState);
		return [
			// currentState.update({
			// 	duels: duels,
			// } as MainWindowState),
			null,
			null,
		];
	}
}
