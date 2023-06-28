export interface HsAchievementsInfo {
	readonly achievements: readonly HsAchievementInfo[];
}

export interface HsAchievementInfo {
	readonly id: number;
	readonly progress: number;
	readonly index?: number;
	readonly completed: boolean;
}

export interface HsAchievementCategory {
	readonly id: number;
	readonly icon: string;
	readonly name: string;
	readonly availablePoints: number;
	readonly points: number;
	readonly completedAchievements: number;
	readonly totalAchievements: number;
	readonly completionPercentage: number;
	readonly unclaimedAchievements: number;
}
