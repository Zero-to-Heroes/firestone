import { AchievementHistoryService } from '@firestone/achievements/common';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';
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
