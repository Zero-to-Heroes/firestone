export interface DeckInfoFromMemory {
	readonly Name: string;
	readonly DeckList: readonly (string | number)[];
	readonly HeroCardId: string;
	readonly IsWild: boolean;
}
