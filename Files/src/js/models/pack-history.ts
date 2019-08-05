export class PackHistory {
	readonly id: string;
	readonly date: Date;
	readonly setId: string;
	readonly cards: readonly any[] = [];

	constructor(setId: string, cards: readonly any[]) {
		this.setId = setId;
		this.date = new Date();
		this.cards = cards;
	}
}
