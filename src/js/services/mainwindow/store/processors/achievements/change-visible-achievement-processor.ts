import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { VisualAchievement } from '../../../../../models/visual-achievement';
import { ChangeVisibleAchievementEvent } from '../../events/achievements/change-visible-achievement-event';
import { Processor } from '../processor';

export class ChangeVisibleAchievementProcessor implements Processor {
	public async process(
		event: ChangeVisibleAchievementEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
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
		const newState = Object.assign(new AchievementsState(), currentState.achievements, {
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: globalCategory.id,
			selectedCategoryId: achievementSet.id,
			// achievementCategories: globalCategory.achievementSets as readonly AchievementSet[],
			achievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			displayedAchievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			selectedAchievementId: newSelectedAchievement.completionSteps[0].id,
			sharingAchievement: undefined,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			achievements: newState,
			isVisible: true,
			navigation: Object.assign(new Navigation(), currentState.navigation, {
				text: globalCategory.name + ' ' + achievementSet.displayName,
				image: null,
			} as Navigation),
		} as MainWindowState);
	}
}
