import { AchievementsNavigationService } from '@firestone/achievements/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { VisualAchievement } from '../../../../../models/visual-achievement';
import { findCategory, retrieveAllAchievements } from '../../../../achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../../achievement/achievements-state-manager.service';
import { FilterShownAchievementsEvent } from '../../events/achievements/filter-shown-achievements-event';
import { Processor } from '../processor';

export class FilterShownAchievementsProcessor implements Processor {
	constructor(
		private readonly stateManager: AchievementsStateManagerService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly nav: AchievementsNavigationService,
	) {}

	public async process(
		event: FilterShownAchievementsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const searchString = (event.searchString || '').toLowerCase();

		if (searchString?.length && searchString.length < 3) {
			return [currentState, navigationState];
		}

		const groupedAchievements = await this.stateManager.groupedAchievements$$.getValueWithInit();
		const selectedCategoryId = this.nav.selectedCategoryId$$.getValue()?.split('/')?.pop();
		const selectedCategory = findCategory(selectedCategoryId, groupedAchievements);

		const allAchievements: readonly VisualAchievement[] = selectedCategory
			? selectedCategory.retrieveAllAchievements()
			: retrieveAllAchievements(groupedAchievements);
		const displayedAchievementsList: readonly string[] =
			searchString?.length && searchString.length > 2
				? allAchievements
						.filter(
							(achv) =>
								achv.name.toLowerCase().indexOf(searchString) !== -1 ||
								achv.text.toLowerCase().indexOf(searchString) !== -1,
						)
						.map((ach) => ach.id)
				: (selectedCategory?.achievements ?? []).map((ach) => ach.id);
		const currentView = this.nav.currentView$$.getValue();
		if (searchString?.length && searchString.length > 2) {
			this.nav.currentView$$?.next('list');
		} else {
			this.nav.currentView$$.next(navigationState.navigationAchievements.viewBeforeSearch ?? 'categories');
		}
		const newState =
			searchString?.length && searchString.length > 2
				? navigationState.navigationAchievements.update({
						viewBeforeSearch:
							currentView !== 'list'
								? currentView
								: navigationState.navigationAchievements.viewBeforeSearch ?? currentView,
						textBeforeSearch:
							navigationState.navigationAchievements.textBeforeSearch ?? this.mainNav.text$$.getValue(),
						displayedAchievementsList: displayedAchievementsList,
				  } as NavigationAchievements)
				: navigationState.navigationAchievements.update({
						displayedAchievementsList: displayedAchievementsList,
				  } as NavigationAchievements);
		const categoryName = selectedCategory?.name ?? 'all achievements';
		const text =
			searchString?.length && searchString.length > 2
				? `Searching for "${searchString}" in ${categoryName}`
				: navigationState.navigationAchievements.textBeforeSearch;
		this.mainNav.text$$.next(text);
		return [
			null,
			navigationState.update({
				navigationAchievements: newState,
			} as NavigationState),
		];
	}
}
