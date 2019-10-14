import { AchievementSet } from '../achievement-set';
import { AchievementHistory } from '../achievement/achievement-history';
import { VisualAchievement } from '../visual-achievement';
import { VisualAchievementCategory } from '../visual-achievement-category';
import { SharingAchievement } from './achievement/sharing-achievement';

export class AchievementsState {
	readonly currentView: string = 'categories';
	readonly menuDisplayType: string = 'menu';
	readonly globalCategories: readonly VisualAchievementCategory[] = [];
	readonly selectedGlobalCategory: VisualAchievementCategory;
	readonly achievementCategories: readonly AchievementSet[] = [];
	readonly selectedCategory: AchievementSet;
	readonly achievementsList: readonly VisualAchievement[] = [];
	readonly displayedAchievementsList: readonly VisualAchievement[] = [];
	readonly selectedAchievementId: string;
	readonly shortDisplay: boolean = false;
	readonly achievementHistory: readonly AchievementHistory[] = [];
	readonly sharingAchievement: SharingAchievement;
}
