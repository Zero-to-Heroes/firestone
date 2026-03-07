import {
	AchievementsNavigationService,
	AchievementsStateManagerService,
	buildAchievementHierarchy,
} from '@firestone/achievements/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState, NavigationAchievements, NavigationState } from '@firestone/mainwindow/common';
import { ShowAchievementDetailsEvent } from '@firestone/mainwindow/common';
import { Processor } from '../processor';

export class ShowAchievementDetailsProcessor implements Processor {
	constructor(
		private readonly stateManager: AchievementsStateManagerService,
		private readonly mainNav: MainWindowNavigationService,
		private readonly nav: AchievementsNavigationService,
	) {}

	public async process(
		event: ShowAchievementDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const groupedAchievements = await this.stateManager.groupedAchievements$$.getValueWithInit();
		const hierarchy = buildAchievementHierarchy(event.achievementId, groupedAchievements);
		if (!hierarchy?.achievement) {
			return [null, null];
		}

		const achievement = hierarchy.achievement.completionSteps[0].id;

		this.nav.currentView$$.next('list');
		this.nav.menuDisplayType$$.next('breadcrumbs');
		const categoryId = hierarchy.categories.map((c) => c.id).join('/');
		this.nav.selectedCategoryId$$.next(categoryId);
		const newAchievements = navigationState.navigationAchievements.update({
			displayedAchievementsList: hierarchy.categories[hierarchy.categories.length - 1].achievements.map(
				(ach) => ach.id,
			) as readonly string[],
			selectedAchievementId: achievement,
		} as NavigationAchievements);
		const text = hierarchy.categories.map((cat) => cat.name).join(' ');
		this.mainNav.text$$.next(text);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('achievements');
		return [
			null,
			navigationState.update({
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
