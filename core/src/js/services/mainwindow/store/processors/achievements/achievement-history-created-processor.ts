import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementHistoryStorageService } from '../../../../achievement/achievement-history-storage.service';
import { AchievementsLoaderService } from '../../../../achievement/data/achievements-loader.service';
import { AchievementHistoryCreatedEvent } from '../../events/achievements/achievement-history-created-event';
import { Processor } from '../processor';

export class AchievementHistoryCreatedProcessor implements Processor {
	constructor(
		private achievementHistoryStorage: AchievementHistoryStorageService,
		private achievementsLoader: AchievementsLoaderService,
	) {}

	public async process(
		event: AchievementHistoryCreatedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		// LOOKS LIKE THIS IS NEVER CALLED ANYWHERE
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			achievementHistory: [
				event.history,
				...currentState.achievements.achievementHistory,
			] as readonly AchievementHistory[],
		} as AchievementsState);
		return [
			currentState.update({
				achievements: newState,
			} as MainWindowState),
			null,
		];
	}
}
