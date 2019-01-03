import { AchievementSet } from "./achievement-set";

export interface VisualAchievementCategory {
	readonly id: string;
    readonly name: string;
    readonly icon: string;
    readonly achievementSets: AchievementSet[];
}