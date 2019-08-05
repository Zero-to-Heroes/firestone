import { ReplayInfo } from './replay-info';

export class Achievement {
	readonly id: string;
	readonly name: string;
	readonly text: string;
	readonly type: string;
	readonly cardId: string;
	readonly cardType: string;
	readonly secondaryCardId: string;
	readonly secondaryCardType: string;
	readonly difficulty: string;
	readonly numberOfCompletions: number = 0;
	readonly replayInfo: readonly ReplayInfo[] = [];

	constructor(
		id: string,
		name: string,
		text: string,
		type: string,
		cardId: string,
		cardType: string,
		secondaryCardId: string,
		secondaryCardType: string,
		difficulty: string,
		numberOfCompletions: number,
		replayInfo: readonly ReplayInfo[],
	) {
		this.id = id;
		this.name = name;
		this.text = text;
		this.type = type;
		this.cardId = cardId;
		this.cardType = cardType;
		this.secondaryCardId = secondaryCardId;
		this.secondaryCardType = secondaryCardType;
		this.difficulty = difficulty;
		this.numberOfCompletions = numberOfCompletions;
		this.replayInfo = replayInfo;
	}
}
