import { DeckInfoFromMemory } from '../mainwindow/decktracker/deck-info-from-memory';

export interface DuelsInfo {
	// readonly HeroCardId: string; // REMOOOOOOOOVE
	readonly DeckId: string;
	readonly HeroCardDbfId: string;
	readonly HeroPowerCardDbfId: string | number;
	readonly SignatureTreasureCardDbfId: string | number;
	readonly PlayerClass: number;

	// Not sure these are needed
	readonly RunActive: boolean;
	readonly SessionActive: boolean;

	readonly DuelsDeck: DeckInfoFromMemory;
	readonly IsPaidEntry: boolean;
	readonly Wins: number;
	readonly Losses: number;
	readonly Rating: number;
	readonly PaidRating: number;
	readonly LastRatingChange: number;

	readonly LootOptionBundles: readonly OptionBundle[];
	readonly ChosenLoot: number;
	readonly TreasureOption: readonly number[];
	readonly ChosenTreasure: number;
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
	readonly DeckList: readonly string[];
}
