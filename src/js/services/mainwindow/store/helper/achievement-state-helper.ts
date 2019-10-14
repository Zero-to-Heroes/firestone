import { AchievementSet } from '../../../../models/achievement-set';
import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { VisualAchievement } from '../../../../models/visual-achievement';
import { VisualAchievementCategory } from '../../../../models/visual-achievement-category';

export class AchievementStateHelper {
	public updateStateFromNewGlobalCategories(
		currentState: AchievementsState,
		newGlobalCategories: readonly VisualAchievementCategory[],
	): AchievementsState {
		const selectedGlobalCategory =
			currentState.selectedGlobalCategory != undefined
				? newGlobalCategories.find(cat => cat.id === currentState.selectedGlobalCategory.id)
				: undefined;
		const achievementCategories = this.updateCategories(currentState.achievementCategories, newGlobalCategories);
		const selectedCategory =
			currentState.selectedCategory != undefined
				? achievementCategories.find(set => set.id === currentState.selectedCategory.id)
				: undefined;
		const achievementsList = this.updateAchievementsList(currentState.achievementsList, newGlobalCategories);
		return Object.assign(new AchievementsState(), currentState, {
			globalCategories: newGlobalCategories,
			selectedGlobalCategory: selectedGlobalCategory,
			achievementCategories: achievementCategories,
			selectedCategory: selectedCategory,
			achievementsList: achievementsList,
			displayedAchievementsList: achievementsList,
		} as AchievementsState);
	}

	private updateCategories(
		existingCategories: readonly AchievementSet[],
		globalCategories: readonly VisualAchievementCategory[],
	): readonly AchievementSet[] {
		const existingCategoryIds = existingCategories.map(cat => cat.id);
		return globalCategories
			.map(cat => cat.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.filter(set => existingCategoryIds.indexOf(set.id) !== -1);
	}

	private updateAchievementsList(
		existingList: readonly VisualAchievement[],
		globalCategories: readonly VisualAchievementCategory[],
	): readonly VisualAchievement[] {
		const existingCategoryIds = existingList.map(achv => achv.id);
		return globalCategories
			.map(cat => cat.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.map(set => set.achievements)
			.reduce((a, b) => a.concat(b), [])
			.filter(achv => existingCategoryIds.indexOf(achv.id) !== -1);
	}
}
