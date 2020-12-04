export interface DuelsInfo {
	readonly Wins: number;
	readonly Losses: number;
	readonly Rating: number;
	readonly PaidRating: number;
	readonly LastRatingChange: number;
	readonly DeckList: readonly number[];
	readonly ChosenLoot: number;
	readonly ChosenTreasure: number;
	readonly LootOptionBundles: readonly OptionBundle[];
	readonly TreasureOption: readonly number[];
	readonly StartingHeroPower: number;
	readonly PlayerClass: number;

	// Not read from memory, just there for compatiblity with standard decklists
	/** @deprecated */
	readonly IsWild: boolean;
	/** @deprecated */
	readonly Name: string;
	/** @deprecated */
	readonly HeroCardId: string;
}

export interface OptionBundle {
	readonly BundleId: number;
	readonly Elements: readonly number[];
}
