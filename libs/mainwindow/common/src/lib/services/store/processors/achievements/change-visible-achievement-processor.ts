import {
	AchievementsNavigationService,
	AchievementsStateManagerService,
	buildAchievementHierarchy,
	VisualAchievement,
} from '@firestone/achievements/common';
import {
	ChangeVisibleAchievementEvent,
	MainWindowState,
	NavigationAchievements,
	NavigationState,
} from '../../store-internal';
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
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const groupedAchievements = await this.stateManager.groupedAchievements$$.getValueWithInit();
		const hierarchy = buildAchievementHierarchy(event.achievementId, groupedAchievements);
		if (!hierarchy?.categories?.length) {
			console.warn('Could not get achievement hierarchy', event.achievementId);
			return [currentState, navigationState];
		}
		const category = hierarchy.categories[hierarchy.categories.length - 1];
		const newSelectedAchievement = category.achievements.find((ach) =>
			ach.completionSteps.some((step) => step.id === event.achievementId),
		);
		if (!newSelectedAchievement) {
			console.warn('Could not find achievement', event.achievementId);
			return [currentState, navigationState];
		}
		this.nav.currentView$$.next('list');
		this.nav.menuDisplayType$$.next('breadcrumbs');
		const categoryId = hierarchy.categories.map((c) => c.id).join('/');
		this.nav.selectedCategoryId$$.next(categoryId);
		const newAchievements = navigationState.navigationAchievements.update({
			selectedAchievementId: newSelectedAchievement.completionSteps[0].id,
			// achievementsList: category.achievements.map(ach => ach.id) as readonly string[],
			displayedAchievementsList: category.achievements.map((ach) => ach.id) as readonly string[],
			sharingAchievement: undefined,
		} as unknown as NavigationAchievements);
		return [
			null,
			navigationState.update({
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
