import { DeckInfoFromMemory } from '../mainwindow/decktracker/deck-info-from-memory';

export interface DuelsInfo {
	readonly HeroCardId: string;
	readonly PlayerClass: number;
	readonly HeroPowerCardId: string | number;
	readonly SignatureTreasureCardId: string | number;

	readonly DuelsDeck: DeckInfoFromMemory;
	readonly Wins: number;
	readonly Losses: number;
	readonly Rating: number;
	readonly PaidRating: number;
	readonly LastRatingChange: number;

	readonly LootOptionBundles: readonly OptionBundle[];
	readonly ChosenLoot: number;
	readonly TreasureOption: readonly number[];
	readonly ChosenTreasure: number;

	// Use that in priority
	// readonly DeckList: readonly (string | number)[];
	// // readonly DeckListWithCardIds: readonly string[];
	// readonly StartingHeroPower: number;
	// // Use that in priority
	// readonly StartingHeroPowerCardId: number;

	// // Not read from memory, just there for compatiblity with standard decklists
	// /** @deprecated */
	// readonly FormatType: GameFormat;
	// /** @deprecated */
	// readonly Name: string;
	// /** @deprecated */
}

export interface OptionBundle {
	readonly BundleId: number;
	readonly Elements: readonly number[];
}

export interface MemoryDuelsHeroPowerOption {
	readonly DatabaseId: number;
	readonly Enabled: boolean;
	readonly Visible: boolean;
	readonly Completed: boolean;
	readonly Locked: boolean;
	readonly Selected: boolean;
}

export interface AdventuresInfo {
	readonly GuestHeroesInfo: readonly GuestHero[];
	readonly HeroPowersInfo: readonly AdventureTreasure[];
	readonly LoadoutTreasuresInfo: readonly AdventureTreasure[];
}

export interface GuestHero {
	readonly Id: number;
	readonly CardDbfId: number;
}

export interface AdventureTreasure {
	readonly Id: number;
	readonly AdventureId: number;
	readonly CardDbfId: number;
	readonly HeroId: number;
	readonly Unlocked: boolean;
}

export interface DuelsDeck {
	readonly HeroCardId: string;
	readonly HeroPowerCardId: string;
	readonly Decklist: readonly string[];
}
