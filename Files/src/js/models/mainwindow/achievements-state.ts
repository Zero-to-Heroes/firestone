import { VisualAchievementCategory } from '../visual-achievement-category';
import { AchievementSet } from '../achievement-set';
import { VisualAchievement } from '../visual-achievement';
import { AchievementHistory } from '../achievement/achievement-history';
import { SharingAchievement } from './achievement/sharing-achievement';

export class AchievementsState {
	readonly currentView: string = 'categories';
	readonly menuDisplayType: string = 'menu';
	readonly globalCategories: readonly VisualAchievementCategory[] = [];
	readonly selectedGlobalCategory: VisualAchievementCategory;
	readonly achievementCategories: readonly AchievementSet[] = [];
	readonly selectedCategory: AchievementSet;
	readonly achievementsList: readonly VisualAchievement[] = [];
	readonly selectedAchievementId: string;
	readonly shortDisplay: boolean = false;
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly sharingAchievement: SharingAchievement;
}
