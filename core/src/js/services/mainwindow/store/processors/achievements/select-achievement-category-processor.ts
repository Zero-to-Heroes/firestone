import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { VisualAchievementCategory } from '../../../../../models/visual-achievement-category';
import { SelectAchievementCategoryEvent } from '../../events/achievements/select-achievement-category-event';
import { SelectAchievementSetEvent } from '../../events/achievements/select-achievement-set-event';
import { Processor } from '../processor';
import { SelectAchievementSetProcessor } from './select-achievement-set-processor';

export class SelectAchievementCategoryProcessor implements Processor {
	public async process(
		event: SelectAchievementCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const globalCategory: VisualAchievementCategory = currentState.achievements.globalCategories.find(
			cat => cat.id === event.globalCategoryId,
		);
		// If there is a single sub-category, we diretly display it
		if (globalCategory.achievementSets.length === 1) {
			const singleEvent = new SelectAchievementSetEvent(globalCategory.achievementSets[0].id);
			return new SelectAchievementSetProcessor().process(singleEvent, currentState, history, navigationState);
		}
		const newAchievements = navigationState.navigationAchievements.update({
			currentView: 'category',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: event.globalCategoryId,
			// achievementCategories: globalCategory.achievementSets as readonly AchievementSet[],
			selectedCategoryId: undefined,
			selectedAchievementId: undefined,
		} as NavigationAchievements);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationAchievements: newAchievements,
				text: globalCategory.name,
				image: null,
			} as NavigationState),
		];
	}
}
