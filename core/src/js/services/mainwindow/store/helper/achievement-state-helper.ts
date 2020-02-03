import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { VisualAchievementCategory } from '../../../../models/visual-achievement-category';

export class AchievementStateHelper {
	public updateStateFromNewGlobalCategories(
		currentState: AchievementsState,
		newGlobalCategories: readonly VisualAchievementCategory[],
	): AchievementsState {
		// const achievementCategories = this.updateCategories(currentState.achievementCategories, newGlobalCategories);
		const achievementsList = this.updateAchievementsList(currentState.achievementsList, newGlobalCategories);
		return Object.assign(new AchievementsState(), currentState, {
			globalCategories: newGlobalCategories,
			// achievementCategories: achievementCategories,
			achievementsList: achievementsList,
			displayedAchievementsList: achievementsList,
		} as AchievementsState);
	}

	// private updateCategories(
	// 	existingCategories: readonly AchievementSet[],
	// 	globalCategories: readonly VisualAchievementCategory[],
	// ): readonly AchievementSet[] {
	// 	const existingCategoryIds = existingCategories.map(cat => cat.id);
	// 	return globalCategories
	// 		.map(cat => cat.achievementSets)
	// 		.reduce((a, b) => a.concat(b), [])
	// 		.filter(set => existingCategoryIds.indexOf(set.id) !== -1);
	// }

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
