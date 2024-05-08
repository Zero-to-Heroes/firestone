import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { buildAchievementHierarchy } from '../../../../achievement/achievement-utils';
import { AchievementsStateManagerService } from '../../../../achievement/achievements-state-manager.service';
import { ShowAchievementDetailsEvent } from '../../events/achievements/show-achievement-details-event';
import { Processor } from '../processor';

export class ShowAchievementDetailsProcessor implements Processor {
	constructor(
		private readonly stateManager: AchievementsStateManagerService,
		private readonly nav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowAchievementDetailsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const groupedAchievements = await this.stateManager.groupedAchievements$$.getValueWithInit();
		const hierarchy = buildAchievementHierarchy(event.achievementId, groupedAchievements);
		if (!hierarchy?.achievement) {
			return [null, null];
		}

		const achievement = hierarchy.achievement.completionSteps[0].id;

		const newAchievements = navigationState.navigationAchievements.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedCategoryId: hierarchy.categories[hierarchy.categories.length - 1].id,
			// achievementsList: categoryHierarchy[categoryHierarchy.length - 1].achievements.map(
			// 	ach => ach.id,
			// ) as readonly string[],
			displayedAchievementsList: hierarchy.categories[hierarchy.categories.length - 1].achievements.map(
				(ach) => ach.id,
			) as readonly string[],
			selectedAchievementId: achievement,
		} as NavigationAchievements);
		const text = hierarchy.categories.map((cat) => cat.name).join(' ');
		this.nav.text$$.next(text);
		this.nav.image$$.next(null);
		this.nav.isVisible$$.next(true);
		return [
			null,
			navigationState.update({
				currentApp: 'achievements',
				navigationAchievements: newAchievements,
			} as NavigationState),
		];
	}
}
