import { AchievementHistoryService } from '@firestone/achievements/common';
import {
	AchievementCompletedEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class AchievementCompletedProcessor implements Processor {
	constructor(private readonly achievementsHistory: AchievementHistoryService) {}

	public async process(
		event: AchievementCompletedEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const achievement = event.achievement;
		this.achievementsHistory.addHistoryItem(achievement);
		return [null, null];
	}
}
