export class BgsOpponentOverview {
	readonly cardId: string;
	readonly playerId: number;

	public static create(base: BgsOpponentOverview): BgsOpponentOverview {
		return Object.assign(new BgsOpponentOverview(), base);
	}
}
