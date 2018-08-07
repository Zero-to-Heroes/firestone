export class CompletedAchievement {

	readonly id: string;
	readonly numberOfCompletions: number = 0;

	constructor(id: string, numberOfCompletions?: number) {
		this.id = id;
		this.numberOfCompletions = numberOfCompletions || 0;
	}

}
