export interface MulliganGuide {
	readonly allDeckCards: readonly MulliganCardAdvice[];
	readonly cardsInHand: readonly string[];
	readonly sampleSize: number;
	readonly opponentClass: 'all' | string;
	readonly noData?: boolean;
}

export interface MulliganCardAdvice {
	readonly cardId: string;
	readonly score: number | null;
	readonly keepRate: number | null;
}
