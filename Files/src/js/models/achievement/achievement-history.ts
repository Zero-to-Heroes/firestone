export class AchievementHistory {

	readonly id: string;
	readonly achievementId: string;
	readonly achievementName: string;
	readonly difficulty: string;
	readonly numberOfCompletions: number;
	readonly creationTimestamp: number;

	constructor(achievementId: string, achievementName: string, numberOfCompletions: number, difficulty: string) {
		this.achievementId = achievementId;
		this.achievementName = achievementName;
		this.difficulty = difficulty;
		this.numberOfCompletions = numberOfCompletions;
		this.creationTimestamp = Date.now();
	}
}
