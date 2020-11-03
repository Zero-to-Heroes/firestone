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

	// Not read from memory, just there for compatiblity with standard decklists
	readonly IsWild: boolean;
	readonly Name: string;
	readonly HeroCardId: string;
}

export interface OptionBundle {
	readonly BundleId: number;
	readonly Elements: readonly number[];
}
