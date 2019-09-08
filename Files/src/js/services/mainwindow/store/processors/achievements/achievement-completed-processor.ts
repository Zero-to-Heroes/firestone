import { Achievement } from '../../../../../models/achievement';
import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { CompletedAchievement } from '../../../../../models/completed-achievement';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementHistoryStorageService } from '../../../../achievement/achievement-history-storage.service';
import { AchievementsStorageService } from '../../../../achievement/achievements-storage.service';
import { AchievementsLoaderService } from '../../../../achievement/data/achievements-loader.service';
import { Events } from '../../../../events.service';
import { AchievementCompletedEvent } from '../../events/achievements/achievement-completed-event';
import { AchievementUpdateHelper } from '../../helper/achievement-update-helper';
import { Processor } from '../processor';

export class AchievementCompletedProcessor implements Processor {
	constructor(
		private achievementsStorage: AchievementsStorageService,
		private historyStorage: AchievementHistoryStorageService,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
		private helper: AchievementUpdateHelper,
	) {}

	public async process(event: AchievementCompletedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		let existingAchievement = await this.achievementsStorage.loadAchievement(event.challenge.achievementId);
		existingAchievement = existingAchievement || event.challenge.defaultAchievement();
		const completedAchievement = new CompletedAchievement(
			existingAchievement.id,
			existingAchievement.numberOfCompletions + 1,
			existingAchievement.replayInfo,
		);
		await this.achievementsStorage.saveAchievement(completedAchievement);
		const newAchievementState = await this.helper.rebuildAchievements(currentState);
		this.events.broadcast(Events.NEW_ACHIEVEMENT, completedAchievement);
		const achievement: Achievement = await this.achievementLoader.getAchievement(completedAchievement.id);
		// Send the notification early
		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, achievement, completedAchievement, event.challenge);
		const historyItem = {
			achievementId: achievement.id,
			achievementName: achievement.name,
			numberOfCompletions: completedAchievement.numberOfCompletions,
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
