import { AchievementHistory } from '../achievement/achievement-history';
import { VisualAchievement } from '../visual-achievement';
import { VisualAchievementCategory } from '../visual-achievement-category';
import { SharingAchievement } from './achievement/sharing-achievement';

export class AchievementsState {
	readonly currentView: string = 'categories';
	readonly menuDisplayType: string = 'menu';
	readonly globalCategories: readonly VisualAchievementCategory[] = [];
	readonly selectedGlobalCategoryId: string;
	// readonly achievementCategories: readonly AchievementSet[] = [];
	readonly selectedCategoryId: string;
	readonly achievementsList: readonly VisualAchievement[] = [];
	// Holds the IDs of the achievements to display
	readonly displayedAchievementsList: readonly string[] = [];
	readonly selectedAchievementId: string;
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly sharingAchievement: SharingAchievement;

	// public updateAchievement(newAchievement: Achievement): AchievementsState {

	// }
}
