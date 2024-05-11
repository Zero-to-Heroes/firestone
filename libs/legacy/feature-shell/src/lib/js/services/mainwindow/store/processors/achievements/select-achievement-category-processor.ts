import { AchievementsNavigationService } from '@firestone/achievements/common';
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
		private readonly mainNav: MainWindowNavigationService,
		private readonly nav: AchievementsNavigationService,
	) {}

	public async process(
		event: SelectAchievementCategoryEvent,
		currentState: MainWindowState,
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
		this.nav.currentView$$.next(shouldDisplayAchievements ? 'list' : 'categories');
		this.nav.menuDisplayType$$.next('breadcrumbs');
		const categoryId = hierarchy.map((c) => c.id).join('/');
		this.nav.selectedCategoryId$$.next(categoryId);
		const newAchievements = navigationState.navigationAchievements.update({
			displayedAchievementsList: shouldDisplayAchievements
				? (category.achievements.map((ach) => ach.id) as readonly string[])
				: [],
			selectedAchievementId: undefined,
		} as NavigationAchievements);
		const text = hierarchy.map((cat) => cat.name).join(' › ');
		this.mainNav.text$$.next(text);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		return [
			null,
			navigationState.update({
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
