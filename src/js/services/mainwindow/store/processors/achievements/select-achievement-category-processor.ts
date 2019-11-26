import { AchievementSet } from '../../../../../models/achievement-set';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { VisualAchievementCategory } from '../../../../../models/visual-achievement-category';
import { SelectAchievementCategoryEvent } from '../../events/achievements/select-achievement-category-event';
import { SelectAchievementSetEvent } from '../../events/achievements/select-achievement-set-event';
import { Processor } from '../processor';
import { SelectAchievementSetProcessor } from './select-achievement-set-processor';

export class SelectAchievementCategoryProcessor implements Processor {
	public async process(
		event: SelectAchievementCategoryEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		const globalCategory: VisualAchievementCategory = currentState.achievements.globalCategories.find(
			cat => cat.id === event.globalCategoryId,
		);
		// If there is a single sub-category, we diretly display it
		if (globalCategory.achievementSets.length === 1) {
			const singleEvent = new SelectAchievementSetEvent(globalCategory.achievementSets[0].id);
			return new SelectAchievementSetProcessor().process(singleEvent, currentState);
		}
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			currentView: 'category',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategory: globalCategory,
			achievementCategories: globalCategory.achievementSets as readonly AchievementSet[],
			selectedCategory: undefined,
			selectedAchievementId: undefined,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
			isVisible: true,
			navigation: Object.assign(new Navigation(), currentState.navigation, {
				text: globalCategory.name,
				image: null,
			} as Navigation),
		} as MainWindowState);
	}
}
