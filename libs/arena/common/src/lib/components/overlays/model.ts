export interface ArenaHeroOption {
	readonly cardId: string;
	readonly tier: string;
	readonly winrate: number;
}
export interface ArenaCardOption {
	readonly cardId: string;
	readonly drawnWinrate: number | null | undefined;
	readonly pickRate: number | null | undefined;
	readonly pickRateDelta: number | null | undefined;
	readonly pickRateHighWins: number | null | undefined;
}
