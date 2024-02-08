import { RankBracket } from '@firestone-hs/constructed-deck-stats';
import { GameFormatString } from '@firestone-hs/reference-data';

export interface MulliganGuide {
	readonly allDeckCards: readonly MulliganCardAdvice[];
	readonly cardsInHand: readonly string[];
	readonly sampleSize: number;
	readonly format: GameFormatString;
	readonly rankBracket: RankBracket;
	readonly opponentClass: 'all' | string;
	readonly noData?: boolean;
}

export interface MulliganCardAdvice {
	readonly cardId: string;
	readonly score: number | null;
}
