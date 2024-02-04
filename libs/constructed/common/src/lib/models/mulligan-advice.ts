export interface MulliganGuide {
	readonly allDeckCards: readonly MulliganCardAdvice[];
}

export interface MulliganCardAdvice {
	readonly cardId: string;
	readonly score: number | null;
}
