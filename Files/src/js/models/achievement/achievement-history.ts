export class AchievementHistory {

	readonly id: string;
	readonly achievementId: string;
	readonly achievementName: string;
	readonly difficulty: string;
	readonly numberOfCompletions: number;
	readonly creationTimestamp: number = Date.now();
	readonly displayName: string;
}
