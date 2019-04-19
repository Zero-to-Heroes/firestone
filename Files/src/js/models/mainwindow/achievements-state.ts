import { VisualAchievementCategory } from "../visual-achievement-category";
import { AchievementSet } from "../achievement-set";
import { VisualAchievement } from "../visual-achievement";
import { AchievementHistory } from "../achievement/achievement-history";
import { SharingAchievement } from "./achievement/sharing-achievement";

export class AchievementsState {
    readonly currentView: string = 'categories';
    readonly menuDisplayType: string = 'menu';
	readonly globalCategories: ReadonlyArray<VisualAchievementCategory> = [];
	readonly selectedGlobalCategory: VisualAchievementCategory;
	readonly achievementCategories: ReadonlyArray<AchievementSet> = [];
	readonly selectedCategory: AchievementSet;
    readonly achievementsList: ReadonlyArray<VisualAchievement> = [];
    readonly selectedAchievementId: string;
    readonly shortDisplay: boolean = false;
    readonly achievementHistory: ReadonlyArray<AchievementHistory> = [];
    readonly sharingAchievement: SharingAchievement;
}