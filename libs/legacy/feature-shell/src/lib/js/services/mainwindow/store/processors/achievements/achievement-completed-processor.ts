import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementHistoryService } from '../../../../achievement/achievements-history.service';
import { AchievementCompletedEvent } from '../../events/achievements/achievement-completed-event';
import { Processor } from '../processor';

export class AchievementCompletedProcessor implements Processor {
	constructor(private readonly achievementsHistory: AchievementHistoryService) {}

	public async process(
		event: AchievementCompletedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const achievement = event.achievement;
		this.achievementsHistory.addHistoryItem(achievement);
		return [null, null];
	}
}
