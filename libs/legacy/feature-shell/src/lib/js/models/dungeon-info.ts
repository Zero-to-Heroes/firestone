export interface DungeonInfo {
	IsRunActive: boolean;
	PaladinWins: number;
	WarriorWins: number;
	DruidWins: number;
	RogueWins: number;
	ShamanWins: number;
	PriestWins: number;
	WarlockWins: number;
	HunterWins: number;
	MageWins: number;

	NextBoss: number;
	DefeatedBosses: number[];

	CurrentDeck: number[];
	LootOption1: number[];
	LootOption2: number[];
	LootOption3: number[];
	ChosenLoot: number;

	ChosenTreasure: number;
	TreasureOptions: number[];
}
