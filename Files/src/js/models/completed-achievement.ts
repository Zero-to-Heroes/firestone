export class CompletedAchievement {

	readonly id: string;
	readonly numberOfCompletions: number = 0;
	readonly replayInfo;

	constructor(id: string, numberOfCompletions?: number, replayInfo?) {
		this.id = id;
		this.numberOfCompletions = numberOfCompletions || 0;
		this.replayInfo = replayInfo;
	}

}
