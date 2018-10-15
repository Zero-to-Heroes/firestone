export class VisualAchievement {

	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly cardId: string;
	readonly text: string;
	readonly achievementStepIds: string[];
	readonly numberOfCompletions: number[] = [];

	constructor(
			id: string, 
			name: string, 
			type: string, 
			cardId: string, 
			text: string, 
			achievementStepIds: string[], 
			numberOfCompletions: number[] = []) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.cardId = cardId;
		this.text = text;
		this.achievementStepIds = achievementStepIds;
		this.numberOfCompletions = numberOfCompletions;
	}
}
