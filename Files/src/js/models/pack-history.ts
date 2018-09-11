export class PackHistory {

	readonly id: string;
	readonly date: Date;
	readonly setId: string;
	readonly cards: ReadonlyArray<any> = [];

	constructor(setId: string, cards: ReadonlyArray<any>) {
		this.setId = setId;
		this.date = new Date();
		this.cards = cards;
	}
}
