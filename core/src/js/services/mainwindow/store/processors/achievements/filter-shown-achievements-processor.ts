import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { VisualAchievement } from '../../../../../models/visual-achievement';
import { FilterShownAchievementsEvent } from '../../events/achievements/filter-shown-achievements-event';
import { Processor } from '../processor';

declare let amplitude;

export class FilterShownAchievementsProcessor implements Processor {
	public async process(
		event: FilterShownAchievementsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const searchString = (event.searchString || '').toLowerCase();
		amplitude.getInstance().logEvent('search', {
			'page': 'achievements',
			'searchString': searchString,
		});
		console.log('[filter-shown-achievements] filtering shown achievements', searchString);
		const allAchievements: readonly VisualAchievement[] =
			currentState.achievements.findAchievements(navigationState.navigationAchievements.achievementsList) || [];
		const displayedAchievementsList: readonly string[] = allAchievements
			.filter(
				achv =>
					achv.name.toLowerCase().indexOf(searchString) !== -1 ||
					achv.text.toLowerCase().indexOf(searchString) !== -1,
			)
			.map(ach => ach.id);
		const newState = navigationState.navigationAchievements.update({
			displayedAchievementsList: displayedAchievementsList,
		} as NavigationAchievements);
		return [
			null,
			navigationState.update({
				navigationAchievements: newState,
			} as NavigationState),
		];
	}
}
