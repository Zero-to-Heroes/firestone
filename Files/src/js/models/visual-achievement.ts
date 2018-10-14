export class VisualAchievement {

	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly cardId: string;
	readonly achievementStepIds: string[];
	readonly numberOfCompletions: number[] = [];

	constructor(id: string, name: string, type: string, cardId: string, achievementStepIds: string[], numberOfCompletions: number[] = []) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.cardId = cardId;
		this.achievementStepIds = achievementStepIds;
		this.numberOfCompletions = numberOfCompletions;
	}
}
