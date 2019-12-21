import { AchievementSet } from '../../../../../models/achievement-set';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { VisualAchievementCategory } from '../../../../../models/visual-achievement-category';
import { ShowAchievementDetailsEvent } from '../../events/achievements/show-achievement-details-event';
import { Processor } from '../processor';

export class ShowAchievementDetailsProcessor implements Processor {
	public async process(event: ShowAchievementDetailsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const selectedSet: AchievementSet = this.pickSet(
			currentState.achievements.globalCategories,
			event.achievementId,
		);
		const achievement = selectedSet.findAchievement(event.achievementId).completionSteps[0].id;
		const newAchievements = Object.assign(new AchievementsState(), currentState.achievements, {
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedCategoryId: selectedSet.id,
			achievementsList: selectedSet.achievements,
			displayedAchievementsList: selectedSet.achievements.map(ach => ach.id) as readonly string[],
			selectedAchievementId: achievement,
		} as AchievementsState);
		return Object.assign(new MainWindowState(), currentState, {
			isVisible: true,
			currentApp: 'achievements',
			achievements: newAchievements,
		} as MainWindowState);
	}

	private pickSet(allCategories: readonly VisualAchievementCategory[], achievementId: string): AchievementSet {
		return allCategories
			.map(cat => cat.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.find(set =>
				set.achievements.some(achievement =>
					achievement.completionSteps.some(step => step.id === achievementId),
				),
			);
	}
}
