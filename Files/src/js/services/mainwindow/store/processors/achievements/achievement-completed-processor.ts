import { Processor } from '../processor';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { AchievementsRepository } from '../../../../achievement/achievements-repository.service';
import { AchievementCompletedEvent } from '../../events/achievements/achievement-completed-event';
import { AchievementsStorageService } from '../../../../achievement/achievements-storage.service';
import { CompletedAchievement } from '../../../../../models/completed-achievement';
import { AchievementUpdateHelper } from '../../helper/achievement-update-helper';
import { Events } from '../../../../events.service';
import { Achievement } from '../../../../../models/achievement';
import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { AchievementHistoryStorageService } from '../../../../achievement/achievement-history-storage.service';
import { AchievementNameService } from '../../../../achievement/achievement-name.service';

export class AchievementCompletedProcessor implements Processor {
	constructor(
		private achievementsStorage: AchievementsStorageService,
		private historyStorage: AchievementHistoryStorageService,
		private repository: AchievementsRepository,
		private events: Events,
		private namingService: AchievementNameService,
		private helper: AchievementUpdateHelper,
	) {}

	public async process(event: AchievementCompletedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		let existingAchievement = await this.achievementsStorage.loadAchievement(event.challenge.getAchievementId());
		existingAchievement = existingAchievement || event.challenge.defaultAchievement();
		const completedAchievement = new CompletedAchievement(
			existingAchievement.id,
			existingAchievement.numberOfCompletions + 1,
			existingAchievement.replayInfo,
		);
		await this.achievementsStorage.saveAchievement(completedAchievement);
		const newAchievementState = await this.helper.rebuildAchievements(currentState);
		this.events.broadcast(Events.NEW_ACHIEVEMENT, completedAchievement);
		const achievement: Achievement = this.repository.getAllAchievements().find(ach => ach.id === completedAchievement.id);
		// Send the notification early
		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, achievement, completedAchievement.numberOfCompletions, event.challenge);
		const historyItem = {
			achievementId: achievement.id,
			achievementName: achievement.name,
			numberOfCompletions: completedAchievement.numberOfCompletions,
			difficulty: achievement.difficulty,
			creationTimestamp: Date.now(),
		} as AchievementHistory;
		await this.historyStorage.save(historyItem);
		const history = (await this.historyStorage.loadAll())
			.filter(history => history.numberOfCompletions === 1)
			.map(history =>
				Object.assign(new AchievementHistory(), history, {
					displayName: this.namingService.displayName(history.achievementId),
				} as AchievementHistory),
			)
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
