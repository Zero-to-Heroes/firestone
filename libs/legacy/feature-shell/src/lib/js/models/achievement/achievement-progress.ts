export interface AchievementsProgress {
	readonly achievements: readonly AchievementProgress[];
}

export interface AchievementProgress {
	readonly id: string;
	readonly type: string;
	readonly name: string;
	readonly text: string;
	readonly progress: number;
	readonly quota: number;
	readonly completed: boolean;
	readonly step: number;
}
