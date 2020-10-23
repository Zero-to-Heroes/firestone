export class DuelsInfo {
	readonly Wins: number;
	readonly Losses: number;
	readonly Rating: number;
	readonly PaidRating: number;
	readonly DeckList: readonly string[];
	readonly ChosenLoot: number;
	readonly ChosenTreasure: number;
	readonly LootOptionBundles: readonly number[];
	readonly TreasureOption: readonly number[];
}
