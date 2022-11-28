export interface HsAchievementsInfo {
	readonly achievements: readonly HsAchievementInfo[];
}

export interface HsAchievementInfo {
	readonly id: number;
	readonly progress: number;
	readonly completed: boolean;
}
