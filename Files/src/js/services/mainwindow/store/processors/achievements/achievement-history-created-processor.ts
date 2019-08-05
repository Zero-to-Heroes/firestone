import { Processor } from '../processor';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementHistoryCreatedEvent } from '../../events/achievements/achievement-history-created-event';
import { AchievementHistoryStorageService } from '../../../../achievement/achievement-history-storage.service';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { AchievementNameService } from '../../../../achievement/achievement-name.service';

export class AchievementHistoryCreatedProcessor implements Processor {
	constructor(private achievementHistoryStorage: AchievementHistoryStorageService, private namingService: AchievementNameService) {}

	public async process(event: AchievementHistoryCreatedEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const history = (await this.achievementHistoryStorage.loadAll())
			.filter(history => history.numberOfCompletions === 1)
			.map(history =>
				Object.assign(new AchievementHistory(), history, {
					displayName: this.namingService.displayName(history.achievementId),
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
