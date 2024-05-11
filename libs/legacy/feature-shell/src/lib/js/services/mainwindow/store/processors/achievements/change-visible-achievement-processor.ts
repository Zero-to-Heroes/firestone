import { AchievementsNavigationService } from '@firestone/achievements/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { VisualAchievement } from '../../../../../models/visual-achievement';
import { buildAchievementHierarchy } from '../../../../achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../../achievement/achievements-state-manager.service';
import { ChangeVisibleAchievementEvent } from '../../events/achievements/change-visible-achievement-event';
import { Processor } from '../processor';

export class ChangeVisibleAchievementProcessor implements Processor {
	constructor(
		private readonly stateManager: AchievementsStateManagerService,
		private readonly nav: AchievementsNavigationService,
	) {}

	public async process(
		event: ChangeVisibleAchievementEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const groupedAchievements = await this.stateManager.groupedAchievements$$.getValueWithInit();
		const hierarchy = buildAchievementHierarchy(event.achievementId, groupedAchievements);
		if (!hierarchy?.categories?.length) {
			console.warn('Could not get achievement hierarchy', event.achievementId);
			return [currentState, navigationState];
		}
		const category = hierarchy.categories[hierarchy.categories.length - 1];
		const newSelectedAchievement: VisualAchievement = category.achievements.find((ach) =>
			ach.completionSteps.some((step) => step.id === event.achievementId),
		);
		this.nav.currentView$$.next('list');
		this.nav.menuDisplayType$$.next('breadcrumbs');
		const categoryId = hierarchy.categories.map((c) => c.id).join('/');
		this.nav.selectedCategoryId$$.next(categoryId);
		const newAchievements = navigationState.navigationAchievements.update({
			selectedAchievementId: newSelectedAchievement.completionSteps[0].id,
			// achievementsList: category.achievements.map(ach => ach.id) as readonly string[],
			displayedAchievementsList: category.achievements.map((ach) => ach.id) as readonly string[],
			sharingAchievement: undefined,
		} as NavigationAchievements);
		return [
			null,
			navigationState.update({
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
