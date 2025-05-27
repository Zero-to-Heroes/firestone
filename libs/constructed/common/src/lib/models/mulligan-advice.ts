import { RankBracket } from '@firestone-hs/constructed-deck-stats';
import { GameFormatString } from '@firestone-hs/reference-data';

export interface MulliganGuide {
	readonly deckstring: string | null;
	readonly archetypeId: number | null;
	readonly allDeckCards: readonly MulliganCardAdvice[];
	readonly cardsInHand: readonly string[];
	readonly sampleSize: number;
	readonly format: GameFormatString;
	readonly playCoin: 'coin' | 'play' | 'all';
	readonly rankBracket: RankBracket;
	readonly opponentClass: 'all' | string;
	readonly noData?: boolean;
	readonly againstAi?: boolean;
}

export interface MulliganCardAdvice {
	readonly cardId: string;
	readonly score: number | null;
	readonly keepRate: number | null;
	readonly drawnWinrateImpact: number | null;
}

export interface MulliganChartData {
	readonly mulliganData: readonly MulliganChartDataCard[];
	readonly sampleSize: number;
	readonly format: string;
	readonly rankBracket: string;
	readonly opponentClass: string;
}

export interface MulliganChartDataCard {
	readonly cardId: string;
	readonly label: string;
	readonly value: number | null;
	readonly rawValue?: number;
	readonly keepRate?: number | null;
	readonly selected: boolean;
	// TODO: don't make that optional?
	readonly keptColor?: string;
	readonly impactColor?: string;
}

export interface MulliganDeckData {
	deckstring: string | null;
	archetypeId: number | null;
	mulliganData: readonly MulliganChartDataCard[];
	format: GameFormatString;
	sampleSize: number;
	rankBracket: string;
	opponentClass: string;
}
