import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementHistoryStorageService } from '../../../../achievement/achievement-history-storage.service';
import { AchievementCompletedEvent } from '../../events/achievements/achievement-completed-event';
import { Processor } from '../processor';

export class AchievementCompletedProcessor implements Processor {
	constructor(private readonly historyStorage: AchievementHistoryStorageService) {}

	public async process(
		event: AchievementCompletedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const achievement = event.achievement;
		const historyItem = {
			achievementId: achievement.id,
			achievementName: achievement.name,
			numberOfCompletions: achievement.numberOfCompletions,
			difficulty: achievement.difficulty,
			creationTimestamp: Date.now(),
			displayName: achievement.displayName,
		} as AchievementHistory;
		console.log('[achievement-completed-processor] saving history item', historyItem.achievementId);
		this.historyStorage.save(historyItem);
		const newHistory = [historyItem, ...(currentState.achievements.achievementHistory || [])];

		const newState = currentState.achievements.update({
			achievementHistory: newHistory as readonly AchievementHistory[],
		} as AchievementsState);
		console.log('[achievement-completed-processor] rebuilt achievement state');
		// We store an history item every time, but we display only the first time an achievement is unlocked
		return [
			currentState.update({
				achievements: newState,
			}),
			null,
		];
	}
}
