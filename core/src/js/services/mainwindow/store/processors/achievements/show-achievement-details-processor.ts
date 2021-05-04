import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationAchievements } from '../../../../../models/mainwindow/navigation/navigation-achievements';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ShowAchievementDetailsEvent } from '../../events/achievements/show-achievement-details-event';
import { Processor } from '../processor';

export class ShowAchievementDetailsProcessor implements Processor {
	public async process(
		event: ShowAchievementDetailsEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// console.log('[show-achievement-details] input', event, currentState);
		const [categoryHierarchy, visualAchievement] = currentState.achievements.findAchievementHierarchy(
			event.achievementId,
		);
		if (!categoryHierarchy || categoryHierarchy.length === 0 || !visualAchievement) {
			return [null, null];
		}
		// console.log('[show-achievement-details] showing achievement', event, achievementSet, visualAchievement);
		const achievement = visualAchievement.completionSteps[0].id;
		// console.log('[show-achievement-details] achievement', achievement, currentState);
		const newAchievements = navigationState.navigationAchievements.update({
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedCategoryId: categoryHierarchy[categoryHierarchy.length - 1].id,
			// achievementsList: categoryHierarchy[categoryHierarchy.length - 1].achievements.map(
			// 	ach => ach.id,
			// ) as readonly string[],
			displayedAchievementsList: categoryHierarchy[categoryHierarchy.length - 1].achievements.map(
				(ach) => ach.id,
			) as readonly string[],
			selectedAchievementId: achievement,
		} as NavigationAchievements);
		const text = categoryHierarchy.map((cat) => cat.name).join(' ');
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'achievements',
				navigationAchievements: newAchievements,
				text: text,
				image: null,
			} as NavigationState),
		];
	}
}
