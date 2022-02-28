export class BgsOpponentOverview {
	readonly cardId: string;

	public static create(base: BgsOpponentOverview): BgsOpponentOverview {
		return Object.assign(new BgsOpponentOverview(), base);
	}
}
