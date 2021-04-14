export class AchievementStateHelper {
	// public updateStateFromNewGlobalCategories(
	// 	dataState: AchievementsState,
	// 	navigationState: NavigationAchievements,
	// 	newGlobalCategories: readonly VisualAchievementCategory[],
	// ): [AchievementsState, NavigationAchievements] {
	// 	// const achievementCategories = this.updateCategories(currentState.achievementCategories, newGlobalCategories);
	// 	const achievementsList = this.updateAchievementsList(navigationState.achievementsList, newGlobalCategories);
	// 	return [
	// 		Object.assign(new AchievementsState(), dataState, {
	// 			categories: newGlobalCategories,
	// 		} as AchievementsState),
	// 		navigationState.update({
	// 			// achievementsList: achievementsList,
	// 			displayedAchievementsList: achievementsList,
	// 		} as NavigationAchievements),
	// 	];
	// }
	// private updateAchievementsList(
	// 	existingList: readonly string[],
	// 	categories: readonly VisualAchievementCategory[],
	// ): readonly string[] {
	// 	return categories
	// 		.map(cat => cat.retrieveAllAchievements())
	// 		.reduce((a, b) => a.concat(b), [])
	// 		.filter(achv => existingList.indexOf(achv.id) !== -1)
	// 		.map(ach => ach.id);
	// }
}
