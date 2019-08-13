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

	public async process(event: AchievementHistoryCreatedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const [historyRef, achievements] = await Promise.all([
			this.achievementHistoryStorage.loadAll(),
			this.achievementsLoader.getAchievements(),
		]);
		const history = historyRef
			.filter(history => history.numberOfCompletions === 1)
			.map(history =>
				Object.assign(new AchievementHistory(), history, {
					displayName: achievements.find(ach => ach.id === history.achievementId).displayName,
				} as AchievementHistory),
			)
			.reverse();
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			achievementHistory: history as readonly AchievementHistory[],
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
		} as MainWindowState);
	}
}
