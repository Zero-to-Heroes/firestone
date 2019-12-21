import { AchievementHistory } from '../achievement/achievement-history';
import { VisualAchievementCategory } from '../visual-achievement-category';
import { SharingAchievement } from './achievement/sharing-achievement';
import { VisualAchievement } from '../visual-achievement';

export class AchievementsState {
	readonly currentView: string = 'categories';
	readonly menuDisplayType: string = 'menu';
	readonly globalCategories: readonly VisualAchievementCategory[] = [];
	readonly selectedGlobalCategoryId: string;
	// readonly achievementCategories: readonly AchievementSet[] = [];
	readonly selectedCategoryId: string;
	// Holds the IDs of all the relevant achievements. The real data is somewhere in the achievements catergories
	readonly achievementsList: readonly string[] = [];
	// Holds the IDs of the achievements to display
	readonly displayedAchievementsList: readonly string[] = [];
	readonly selectedAchievementId: string;
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly sharingAchievement: SharingAchievement;

	// public updateAchievement(newAchievement: Achievement): AchievementsState {

	// }
	public findAchievements(ids: readonly string[]): readonly VisualAchievement[] {
		return this.globalCategories
			.map(cat => cat.achievementSets)
			.reduce((a, b) => a.concat(b), [])
			.map(set => set.achievements)
			.reduce((a, b) => a.concat(b), [])
			.filter(achv => ids.indexOf(achv.id) !== -1);
	}
}
