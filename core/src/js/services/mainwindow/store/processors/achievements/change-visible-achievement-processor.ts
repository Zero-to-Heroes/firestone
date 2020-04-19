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
		const globalCategory = currentState.achievements.globalCategories.find(cat =>
			cat.achievementSets.some(set =>
				set.achievements.some(achv => achv.completionSteps.some(setp => setp.id === event.achievementId)),
			),
		);
		const achievementSet = globalCategory.achievementSets.find(set =>
			set.achievements.some(achv => achv.completionSteps.some(setp => setp.id === event.achievementId)),
		);
		const newSelectedAchievement: VisualAchievement = achievementSet.achievements.find(ach =>
			ach.completionSteps.some(step => step.id === event.achievementId),
		);
		const newAchievements = navigationState.navigationAchievements.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: globalCategory.id,
			selectedCategoryId: achievementSet.id,
			selectedAchievementId: newSelectedAchievement.completionSteps[0].id,
			achievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			displayedAchievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
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
