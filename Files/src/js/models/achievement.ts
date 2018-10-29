import { ReplayInfo } from "./replay-info";

export class Achievement {

	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly cardId: string;
	readonly difficulty: string;
	readonly numberOfCompletions: number = 0;
	readonly replayInfo: ReadonlyArray<ReplayInfo> = [];

	constructor(
			id: string, 
			name: string, 
			type: string, 
			cardId: string, 
			difficulty: string, 
			numberOfCompletions: number, 
			replayInfo: ReadonlyArray<ReplayInfo>) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.cardId = cardId;
		this.difficulty = difficulty;
		this.numberOfCompletions = numberOfCompletions;
		this.replayInfo = replayInfo;
	}
}
