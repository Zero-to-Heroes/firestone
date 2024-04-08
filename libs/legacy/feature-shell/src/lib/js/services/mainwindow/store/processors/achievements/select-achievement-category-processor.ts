import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { builCategoryHierarchy } from '../../../../achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../../achievement/achievements-state-manager.service';
import { SelectAchievementCategoryEvent } from '../../events/achievements/select-achievement-category-event';
import { Processor } from '../processor';

export class SelectAchievementCategoryProcessor implements Processor {
	constructor(
		private readonly stateManager: AchievementsStateManagerService,
		private readonly nav: MainWindowNavigationService,
	) {}

	public async process(
		event: SelectAchievementCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const groupedAchievements = await this.stateManager.groupedAchievements$$.getValueWithInit();
		const hierarchyResult = builCategoryHierarchy(event.categoryId, groupedAchievements);
		const hierarchy = hierarchyResult?.categories;
		console.debug('[select-achievement-category] hierarchy', hierarchy, event.categoryId, groupedAchievements);
		if (!hierarchy?.length) {
			return [null, null];
		}

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
		const text = hierarchy.map((cat) => cat.name).join(' › ');
		this.nav.text$$.next(text);
		this.nav.image$$.next(null);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
