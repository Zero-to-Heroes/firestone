import {
	AchievementsNavigationService,
	AchievementsStateManagerService,
	builCategoryHierarchy,
} from '@firestone/achievements/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState, NavigationAchievements, NavigationState } from '@firestone/mainwindow/common';
import { SelectAchievementCategoryEvent } from '@firestone/mainwindow/common';
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
