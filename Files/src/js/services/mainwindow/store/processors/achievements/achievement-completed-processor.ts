import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementHistoryStorageService } from '../../../../achievement/achievement-history-storage.service';
import { AchievementsLoaderService } from '../../../../achievement/data/achievements-loader.service';
import { AchievementCompletedEvent } from '../../events/achievements/achievement-completed-event';
import { AchievementUpdateHelper } from '../../helper/achievement-update-helper';
import { Processor } from '../processor';

export class AchievementCompletedProcessor implements Processor {
	constructor(
		private historyStorage: AchievementHistoryStorageService,
		private achievementLoader: AchievementsLoaderService,
		private helper: AchievementUpdateHelper,
	) {}

	public async process(event: AchievementCompletedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const achievement = event.achievement;
		// TODO: all this can probably be done here with a little effort, instead of rebuilding everything
		const newAchievementState: AchievementsState = await this.helper.rebuildAchievements(currentState);
		console.log('[achievement-completed-processor] rebuilt achievement state');
		const historyItem = {
			achievementId: achievement.id,
			achievementName: achievement.name,
			numberOfCompletions: achievement.numberOfCompletions,
			difficulty: achievement.difficulty,
			creationTimestamp: Date.now(),
		} as AchievementHistory;
		await this.historyStorage.save(historyItem);
		const [historyRef, achievements] = await Promise.all([this.historyStorage.loadAll(), this.achievementLoader.getAchievements()]);
		const history = historyRef
			.filter(history => history.numberOfCompletions === 1)
			.map(history => {
				const matchingAchievement = achievements.find(ach => ach.id === history.achievementId);
				// This can happen with older history items
				if (!matchingAchievement) {
					return null;
				}
				return Object.assign(new AchievementHistory(), history, {
					displayName: achievements.find(ach => ach.id === history.achievementId).displayName,
				} as AchievementHistory);
			})
			.filter(history => history)
			.reverse();
		const newState = Object.assign(new AchievementsState(), newAchievementState, {
			achievementHistory: history as readonly AchievementHistory[],
		} as AchievementsState);
		// We store an history item every time, but we display only the first time an achievement is unlocked
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
		});
	}
}
