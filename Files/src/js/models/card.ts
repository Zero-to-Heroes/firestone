export class Card {
	readonly id: string;
	readonly count: number;
	readonly premiumCount: number;

	constructor(id: string, count: number, premiumCount: number) {
		this.id = id;
		this.count = count;
		this.premiumCount = premiumCount;
	}
}
