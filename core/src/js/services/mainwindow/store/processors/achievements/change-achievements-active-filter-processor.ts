import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ChangeAchievementsActiveFilterEvent } from '../../events/achievements/change-achievements-active-filter-event';
import { Processor } from '../processor';

export class ChangeAchievementsActiveFilterProcessor implements Processor {
	public async process(
		event: ChangeAchievementsActiveFilterEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newAchievements = navigationState.navigationAchievements.update({
			achievementActiveFilter: event.newFilter,
		} as NavigationAchievements);
		return [
			null,
			navigationState.update({
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
