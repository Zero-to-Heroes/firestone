import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { builCategoryHierarchy } from '../../../../achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../../achievement/achievements-state-manager.service';
import { SelectAchievementCategoryEvent } from '../../events/achievements/select-achievement-category-event';
import { Processor } from '../processor';

export class SelectAchievementCategoryProcessor implements Processor {
	constructor(private readonly stateManager: AchievementsStateManagerService) {}

	public async process(
		event: SelectAchievementCategoryEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const hierarchyResult = builCategoryHierarchy(
			event.categoryId,
			this.stateManager.groupedAchievements$$.getValue(),
		);
		const hierarchy = hierarchyResult?.categories;
		console.debug(
			'[select-achievement-category] hierarchy',
			hierarchy,
			event.categoryId,
			this.stateManager.groupedAchievements$$.getValue(),
		);
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
