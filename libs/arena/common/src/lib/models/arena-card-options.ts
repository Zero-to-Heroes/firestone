export interface ArenaHeroOption {
	readonly cardId: string;
	readonly tier: string;
	readonly winrate: number;
	readonly tip: ArenaClassInfoTip | null;
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
