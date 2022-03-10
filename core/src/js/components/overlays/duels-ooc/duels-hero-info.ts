export interface DuelsHeroInfo {
	readonly cardId: string;
	readonly name: string;
	readonly globalWinrate: number;
	readonly playerWinrate: number;
	readonly globalPopularity: number;
	readonly playerMatches: number;
	readonly globalWinDistribution: readonly { winNumber: number; value: number }[];
	readonly topDecks: readonly DuelsHeroInfoTopDeck[];
}

export interface DuelsHeroInfoTopDeck {
	readonly deckId: string;
}
