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
	readonly decklist: string;
	readonly heroCardId: string;
	readonly heroPowerCardId: string;
	readonly signatureTreasureCardId: string;
	readonly wins: number;
	readonly losses: number;
	readonly treasureCardIds: readonly string[];
	readonly dust: number;
}

export interface DuelsHeroPowerInfo {
	readonly cardId: string;
	readonly heroCardId: string;
	readonly name: string;
	readonly globalWinrate: number;
	readonly playerWinrate: number;
	readonly globalPopularity: number;
	readonly playerMatches: number;
	readonly globalWinDistribution: readonly { winNumber: number; value: number }[];
	readonly topDecks: readonly DuelsHeroInfoTopDeck[];
}

export interface DuelsSignatureTreasureInfo {
	readonly cardId: string;
	readonly heroCardId: string;
	readonly heroPowerCardId: string;
	readonly name: string;
	readonly globalWinrate: number;
	readonly playerWinrate: number;
	readonly globalPopularity: number;
	readonly playerMatches: number;
	readonly globalWinDistribution: readonly { winNumber: number; value: number }[];
	readonly topDecks: readonly DuelsHeroInfoTopDeck[];
}
