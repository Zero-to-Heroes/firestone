import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
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
	): Promise<MainWindowState> {
		// LOOKS LIKE THIS IS NEVER CALLED ANYWHERE

		// const [historyRef, achievements] = await Promise.all([
		// 	this.achievementHistoryStorage.loadAll(),
		// 	this.achievementsLoader.getAchievements(),
		// ]);
		// // TODO: extract this piece of code to a reusable service
		// const history = historyRef
		// 	.filter(history => history.numberOfCompletions === 1)
		// 	.map(history => {
		// 		const matchingAchievement = achievements.find(ach => ach.id === history.achievementId);
		// 		// This can happen with older history items
		// 		if (!matchingAchievement) {
		// 			return null;
		// 		}
		// 		return Object.assign(new AchievementHistory(), history, {
		// 			displayName: achievements.find(ach => ach.id === history.achievementId).displayName,
		// 		} as AchievementHistory);
		// 	})
		// 	.filter(history => history)
		// 	.reverse();
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			achievementHistory: [
				event.history,
				...currentState.achievements.achievementHistory,
			] as readonly AchievementHistory[],
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
		} as MainWindowState);
	}
}
