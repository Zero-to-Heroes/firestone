export class BgsOpponentOverview {
	readonly cardId: string;
	// readonly currentTavernTier: number;
	// readonly lastKnownBoardState: readonly BoardEntity[] = [];
	// readonly tavernHistory: readonly BgsTavernUpgrade[] = [];
	// readonly tripleHistory: readonly BgsTriple[] = [];

	public static create(base: BgsOpponentOverview): BgsOpponentOverview {
		return Object.assign(new BgsOpponentOverview(), base);
	}
}
