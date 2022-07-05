import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { AchievementsInitEvent } from '../../events/achievements/achievements-init-event';
import { Processor } from '../processor';

export class AchievementsInitProcessor implements Processor {
	public async process(
		event: AchievementsInitEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState, NavigationState]> {
		const newAchievements = currentState.achievements.update({
			categories: event.categories,
		} as AchievementsState);
		const result = currentState.update({
			achievements: newAchievements,
		} as MainWindowState);

		return [result, null];
	}
}
