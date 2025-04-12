export interface HsAchievementsInfo {
	readonly achievements: readonly HsAchievementInfo[];
}

export interface HsAchievementInfo {
	readonly id: number;
	readonly progress: number;
	readonly index?: number;
	readonly completed?: boolean;
}
export const equalHsAchievementInfo = (
	a: HsAchievementInfo | null | undefined,
	b: HsAchievementInfo | null | undefined,
): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;

	return a.id === b.id && a.progress === b.progress && a.completed === b.completed && a.index === b.index;
};

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
