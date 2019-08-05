import { Processor } from '../processor';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { AchievementSet } from '../../../../../models/achievement-set';
import { ShowAchievementDetailsEvent } from '../../events/achievements/show-achievement-details-event';
import { VisualAchievementCategory } from '../../../../../models/visual-achievement-category';

export class ShowAchievementDetailsProcessor implements Processor {
	public async process(event: ShowAchievementDetailsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const selectedSet: AchievementSet = this.pickSet(currentState.achievements.globalCategories, event.achievementId);
		const newAchievements = Object.assign(new AchievementsState(), currentState.achievements, {
			currentView: 'list',
			menuDisplayType: 'breadcrumbs',
			selectedCategory: selectedSet,
			achievementsList: selectedSet.achievements,
			selectedAchievementId: selectedSet.findAchievement(event.achievementId).completionSteps[0].id,
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
			.find(set => set.achievements.some(achievement => achievement.completionSteps.some(step => step.id === achievementId)));
	}
}
