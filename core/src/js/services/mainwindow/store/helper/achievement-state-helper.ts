import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { NavigationAchievements } from '../../../../models/mainwindow/navigation/navigation-achievements';
import { VisualAchievementCategory } from '../../../../models/visual-achievement-category';

export class AchievementStateHelper {
	public updateStateFromNewGlobalCategories(
		dataState: AchievementsState,
		navigationState: NavigationAchievements,
		newGlobalCategories: readonly VisualAchievementCategory[],
	): [AchievementsState, NavigationAchievements] {
		// const achievementCategories = this.updateCategories(currentState.achievementCategories, newGlobalCategories);
		const achievementsList = this.updateAchievementsList(navigationState.achievementsList, newGlobalCategories);
		return [
			Object.assign(new AchievementsState(), dataState, {
				globalCategories: newGlobalCategories,
			} as AchievementsState),
			navigationState.update({
				achievementsList: achievementsList,
				displayedAchievementsList: achievementsList,
			} as NavigationAchievements),
		];
	}

	private updateAchievementsList(
		existingList: readonly string[],
		globalCategories: readonly VisualAchievementCategory[],
	): readonly string[] {
		return globalCategories
			.map(cat => cat.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.map(set => set.achievements)
			.reduce((a, b) => a.concat(b), [])
			.filter(achv => existingList.indexOf(achv.id) !== -1)
			.map(ach => ach.id);
	}
}
