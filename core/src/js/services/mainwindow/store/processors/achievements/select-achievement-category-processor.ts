import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectAchievementCategoryEvent } from '../../events/achievements/select-achievement-category-event';
import { Processor } from '../processor';

export class SelectAchievementCategoryProcessor implements Processor {
	public async process(
		event: SelectAchievementCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const hierarchy = currentState.achievements.findCategoryHierarchy(event.categoryId);
		const category = hierarchy[hierarchy.length - 1];
		const shouldDisplayAchievements = category.achievements.length > 0;
		const newAchievements = navigationState.navigationAchievements.update({
			currentView: shouldDisplayAchievements ? 'list' : 'categories',
			menuDisplayType: 'breadcrumbs',
			selectedCategoryId: category.id,
			// achievementsList: shouldDisplayAchievements
			// 	? (category.achievements.map(ach => ach.id) as readonly string[])
			// 	: [],
			displayedAchievementsList: shouldDisplayAchievements
				? (category.achievements.map((ach) => ach.id) as readonly string[])
				: [],
			selectedAchievementId: undefined,
		} as NavigationAchievements);
		const text = hierarchy.map((cat) => cat.name).join(' ');
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationAchievements: newAchievements,
				text: text,
				image: null,
			} as NavigationState),
		];
	}
}
