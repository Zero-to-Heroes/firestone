export interface ArenaHeroOption {
	readonly cardId: string;
	readonly tier: string | null | undefined;
	readonly winrate: number | null | undefined;
	readonly tip: ArenaClassInfoTip | null | undefined;
	// Used to show the hero power + hero combination
	readonly contextCardIds: readonly string[];
	// Used to show average hero stats across all hero powers
	readonly averageHeroStat: ArenaHeroOption | null;
}
export interface ArenaCardOption {
	readonly cardId: string;
	isPackageCard?: boolean;
	readonly drawnWinrate: number | null | undefined;
	readonly drawnImpact: number | null;
	readonly deckWinrate: number | null | undefined;
	readonly deckImpact: number | null;
	readonly pickRate: number | null | undefined;
	readonly pickRateDelta: number | null | undefined;
	readonly pickRateHighWins: number | null | undefined;
	readonly dataPoints: number | null | undefined;
	splitClasses?: ArenaCardOption[];
}

export interface ArenaClassInfoTip {
	readonly tip: string;
	readonly author?: string;
	readonly patchNumber?: number;
	readonly patch?: string;
	readonly date?: string;
}
