export interface AchievementHistory {
	readonly id: string;
	readonly achievementId: string;
	readonly achievementName: string;
	readonly difficulty: string;
	readonly numberOfCompletions: number;
	readonly creationTimestamp: number;
	readonly displayName: string;
}
