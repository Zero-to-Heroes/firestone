import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { ShowAchievementDetailsEvent } from '../../events/achievements/show-achievement-details-event';
import { Processor } from '../processor';

export class ShowAchievementDetailsProcessor implements Processor {
	public async process(event: ShowAchievementDetailsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		console.log('[show-achievement-details] input', event, currentState);
		const [globalCategory, achievementSet, visualAchievement] = currentState.achievements.findAchievementHierarchy(
			event.achievementId,
		);
		// console.log('[show-achievement-details] showing achievement', event, achievementSet, visualAchievement);
		const achievement = visualAchievement.completionSteps[0].id;
		// console.log('[show-achievement-details] achievement', achievement, currentState);
		const newAchievements = Object.assign(new AchievementsState(), currentState.achievements, {
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedGlobalCategoryId: globalCategory.id,
			selectedCategoryId: achievementSet.id,
			achievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			displayedAchievementsList: achievementSet.achievements.map(ach => ach.id) as readonly string[],
			selectedAchievementId: achievement,
		} as AchievementsState);
		// console.log('[show-achievement-details] showing achievement state', newAchievements);
		return Object.assign(new MainWindowState(), currentState, {
			isVisible: true,
			currentApp: 'achievements',
			achievements: newAchievements,
		} as MainWindowState);
	}

	// private pickSet(allCategories: readonly VisualAchievementCategory[], achievementId: string): AchievementSet {
	// 	return allCategories
	// 		.map(cat => cat.achievementSets)
	// 		.reduce((a, b) => a.concat(b), [])
	// 		.find(set =>
	// 			set.achievements.some(achievement =>
	// 				achievement.completionSteps.some(step => step.id === achievementId),
	// 			),
	// 		);
	// }
}
