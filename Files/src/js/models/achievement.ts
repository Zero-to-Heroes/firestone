export class Achievement {

	readonly id: string;
	readonly name: string;
	readonly type: string;
	readonly cardId: string;
	readonly numberOfCompletions: number = 0;

	constructor(id: string, name: string, type: string, cardId: string, numberOfCompletions: number = 0) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.cardId = cardId;
		this.numberOfCompletions = numberOfCompletions;
	}
}
