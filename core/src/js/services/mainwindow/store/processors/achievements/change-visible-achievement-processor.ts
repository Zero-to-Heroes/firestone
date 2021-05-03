import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { VisualAchievement } from '../../../../../models/visual-achievement';
import { ChangeVisibleAchievementEvent } from '../../events/achievements/change-visible-achievement-event';
import { Processor } from '../processor';

export class ChangeVisibleAchievementProcessor implements Processor {
	public async process(
		event: ChangeVisibleAchievementEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const hierarchy = currentState.achievements.findAchievementHierarchy(event.achievementId);
		if (!hierarchy[0]?.length) {
			console.warn('Could not get achievement hierarchy', event.achievementId);
			return [currentState, navigationState];
		}
		const category = hierarchy[0][hierarchy[0].length - 1];
		const newSelectedAchievement: VisualAchievement = category.achievements.find(ach =>
			ach.completionSteps.some(step => step.id === event.achievementId),
		);
		const newAchievements = navigationState.navigationAchievements.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedCategoryId: category.id,
			selectedAchievementId: newSelectedAchievement.completionSteps[0].id,
			// achievementsList: category.achievements.map(ach => ach.id) as readonly string[],
			displayedAchievementsList: category.achievements.map(ach => ach.id) as readonly string[],
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
