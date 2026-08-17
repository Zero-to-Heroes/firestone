import { GameFormat as GameFormatEnum } from '@firestone-hs/reference-data';
import { CardAnalysis } from '@firestone-hs/replay-metadata';
import { PatchInfo } from '@firestone/shared/common/service';
import { MulliganCardAdvice, MulliganPersonalMinGames } from '../models/mulligan-advice';

/** Same keep / impact / drawn counters as cron-constructed-stats buildCardsDataForDeck. */

export interface AggregatedCardMulliganData {
	readonly cardId: string;
	readonly drawnBeforeMulligan: number;
	readonly keptInMulligan: number;
	readonly inHandAfterMulligan: number;
	readonly inHandAfterMulliganThenWin: number;
	readonly drawn: number;
	readonly drawnThenWin: number;
}

export interface PersonalMulliganMatch {
	readonly result: string;
	readonly cardsAnalysis?: readonly CardAnalysis[] | null;
}

export interface PlayerDeckMatchFilterInput extends PersonalMulliganMatch {
	readonly reviewId?: string;
	readonly opponentClass?: string;
	readonly gameFormat?: string;
	readonly coinPlay?: string;
	readonly creationTimestamp?: number;
}

export const aggregatePersonalCardMulliganData = (
	matches: readonly PersonalMulliganMatch[],
): readonly AggregatedCardMulliganData[] => {
	const byCardId = new Map<string, MutableAggregatedCardMulliganData>();
	for (const match of matches) {
		if (!match.cardsAnalysis?.length) {
			continue;
		}
		const won = match.result === 'won';
		for (const analysis of match.cardsAnalysis) {
			if (!analysis?.cardId) {
				continue;
			}
			const aggregated = byCardId.get(analysis.cardId) ?? emptyAggregated(analysis.cardId);
			aggregated.drawnBeforeMulligan += analysis.drawnBeforeMulligan ? 1 : 0;
			aggregated.keptInMulligan += analysis.drawnBeforeMulligan && analysis.mulligan ? 1 : 0;
			aggregated.inHandAfterMulligan += analysis.mulligan ? 1 : 0;
			aggregated.inHandAfterMulliganThenWin += analysis.mulligan && won ? 1 : 0;
			aggregated.drawn += (analysis.drawnTurn ?? 0) > 0 ? 1 : 0;
			aggregated.drawnThenWin += (analysis.drawnTurn ?? 0) > 0 && won ? 1 : 0;
			byCardId.set(analysis.cardId, aggregated);
		}
	}
	return [...byCardId.values()];
};

export const buildMulliganCardAdvice = (
	cardIds: readonly string[],
	cardsData: readonly AggregatedCardMulliganData[],
	baselineWinrate: number,
	findCardData: (
		cardId: string,
		cardsData: readonly AggregatedCardMulliganData[],
	) => AggregatedCardMulliganData | undefined,
): readonly MulliganCardAdvice[] => {
	return (
		cardIds?.map((cardId) => {
			const cardData = findCardData(cardId, cardsData);
			const rawImpact = !!cardData?.inHandAfterMulligan
				? cardData.inHandAfterMulliganThenWin / cardData.inHandAfterMulligan - baselineWinrate
				: null;
			const rawKeepRate = !!cardData?.drawnBeforeMulligan
				? cardData.keptInMulligan / cardData.drawnBeforeMulligan
				: null;
			const rawDrawnWinrateImpact = !!cardData?.drawn
				? cardData.drawnThenWin / cardData.drawn - baselineWinrate
				: null;
			const mulliganAdvice: MulliganCardAdvice = {
				cardId: cardId,
				score: rawImpact == null ? null : 100 * rawImpact,
				keepRate: rawKeepRate,
				drawnWinrateImpact: rawDrawnWinrateImpact,
			};
			return mulliganAdvice;
		}) ?? []
	);
};

export const meetsPersonalMinGames = (
	sampleSize: number,
	pref: MulliganPersonalMinGames | null | undefined,
): boolean => {
	const resolved = pref ?? '25';
	if (resolved === 'never') {
		return false;
	}
	if (resolved === 'always') {
		return sampleSize > 0;
	}
	return sampleSize >= Number(resolved);
};

export const mergeCommunityAndPersonalAdvice = (
	community: readonly MulliganCardAdvice[],
	personal: readonly MulliganCardAdvice[],
): readonly MulliganCardAdvice[] => {
	const personalByCardId = new Map(personal.map((card) => [card.cardId, card]));
	return community.map((card) => {
		const personalCard = personalByCardId.get(card.cardId);
		return {
			...card,
			personalKeepRate: personalCard?.keepRate ?? null,
			personalScore: personalCard?.score ?? null,
		};
	});
};

export const filterRelevantPlayerDeckMatches = <T extends PlayerDeckMatchFilterInput>(
	playerDeckMatches: readonly T[] | null | undefined,
	opponentClass: string,
	format: GameFormatEnum,
	playCoin: 'coin' | 'play' | 'all',
	timeFrame: 'last-patch' | 'past-3' | 'past-7',
	patchInfo: PatchInfo | null | undefined,
): readonly T[] => {
	return (
		playerDeckMatches
			?.filter((m) => opponentClass === 'all' || m.opponentClass === opponentClass)
			.filter((m) => isCorrectFormat(m, format))
			.filter((m) => isCorrectPlayCoin(m, playCoin))
			.filter((m) => isCorrectTime(m, timeFrame, patchInfo)) ?? []
	);
};

export const isSamePlayerDecklist = (
	stored: string | null | undefined,
	current: string | null | undefined,
	normalize: (deckstring: string) => string | null,
): boolean => {
	if (!stored?.length || !current?.length) {
		return false;
	}
	if (stored === current) {
		return true;
	}
	try {
		const normalizedStored = normalize(stored);
		const normalizedCurrent = normalize(current);
		return !!normalizedStored && normalizedStored === normalizedCurrent;
	} catch {
		return false;
	}
};

export const isCorrectFormat = (match: PlayerDeckMatchFilterInput, format: GameFormatEnum): boolean => {
	switch (format) {
		case GameFormatEnum.FT_WILD:
			return match.gameFormat === 'wild';
		case GameFormatEnum.FT_STANDARD:
			return match.gameFormat === 'standard';
		case GameFormatEnum.FT_CLASSIC:
			return match.gameFormat === 'classic';
		case GameFormatEnum.FT_TWIST:
			return match.gameFormat === 'twist';
		default:
			return false;
	}
};

export const isCorrectPlayCoin = (match: PlayerDeckMatchFilterInput, playCoin: 'coin' | 'play' | 'all'): boolean => {
	if (playCoin === 'all') {
		return true;
	}
	if (playCoin === 'coin') {
		return match.coinPlay === 'coin';
	}
	if (playCoin === 'play') {
		return match.coinPlay === 'play';
	}
	return false;
};

export const isCorrectTime = (
	match: PlayerDeckMatchFilterInput,
	timeFrame: 'last-patch' | 'past-3' | 'past-7',
	patchInfo: PatchInfo | null | undefined,
): boolean => {
	switch (timeFrame) {
		case 'past-3':
			return (match.creationTimestamp ?? 0) > Date.now() - 3 * 24 * 60 * 60 * 1000;
		case 'past-7':
			return (match.creationTimestamp ?? 0) > Date.now() - 7 * 24 * 60 * 60 * 1000;
		case 'last-patch':
			return !patchInfo ? false : (match.creationTimestamp ?? 0) > new Date(patchInfo.date).getTime();
	}
};

export const chunkReviewIds = (reviewIds: readonly string[], batchSize: number): string[][] => {
	const chunks: string[][] = [];
	for (let i = 0; i < reviewIds.length; i += batchSize) {
		chunks.push([...reviewIds.slice(i, i + batchSize)]);
	}
	return chunks;
};

interface MutableAggregatedCardMulliganData {
	cardId: string;
	drawnBeforeMulligan: number;
	keptInMulligan: number;
	inHandAfterMulligan: number;
	inHandAfterMulliganThenWin: number;
	drawn: number;
	drawnThenWin: number;
}

const emptyAggregated = (cardId: string): MutableAggregatedCardMulliganData => ({
	cardId,
	drawnBeforeMulligan: 0,
	keptInMulligan: 0,
	inHandAfterMulligan: 0,
	inHandAfterMulliganThenWin: 0,
	drawn: 0,
	drawnThenWin: 0,
});
