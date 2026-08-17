import { GameFormat as GameFormatEnum } from '@firestone-hs/reference-data';
import { CardAnalysis } from '@firestone-hs/replay-metadata';
import { PatchInfo } from '@firestone/shared/common/service';
import {
	aggregatePersonalCardMulliganData,
	buildMulliganCardAdvice,
	chunkReviewIds,
	filterRelevantPlayerDeckMatches,
	isCorrectFormat,
	isCorrectPlayCoin,
	isCorrectTime,
	isSamePlayerDecklist,
	meetsPersonalMinGames,
	mergeCommunityAndPersonalAdvice,
	PlayerDeckMatchFilterInput,
} from './constructed-personal-mulligan-stats';

const card = (overrides: Partial<CardAnalysis> & { cardId: string }): CardAnalysis => ({
	drawnBeforeMulligan: false,
	mulligan: false,
	kept: false,
	drawnTurn: undefined,
	playedTurn: null,
	playedOnCurve: false,
	...overrides,
});

describe('aggregatePersonalCardMulliganData', () => {
	it('aggregates keep rate, mulligan impact counts, and drawn winrate', () => {
		const result = aggregatePersonalCardMulliganData([
			{
				result: 'won',
				cardsAnalysis: [
					card({ cardId: 'EX1_001', drawnBeforeMulligan: true, mulligan: true, kept: true, drawnTurn: 2 }),
				],
			},
			{
				result: 'lost',
				cardsAnalysis: [
					card({ cardId: 'EX1_001', drawnBeforeMulligan: true, mulligan: false, kept: false, drawnTurn: 3 }),
				],
			},
			{
				result: 'won',
				cardsAnalysis: [card({ cardId: 'EX1_002', mulligan: true, drawnTurn: 0 })],
			},
		]);

		const first = result.find((c) => c.cardId === 'EX1_001');
		expect(first).toEqual({
			cardId: 'EX1_001',
			drawnBeforeMulligan: 2,
			keptInMulligan: 1,
			inHandAfterMulligan: 1,
			inHandAfterMulliganThenWin: 1,
			drawn: 2,
			drawnThenWin: 1,
		});
		const second = result.find((c) => c.cardId === 'EX1_002');
		expect(second?.inHandAfterMulligan).toBe(1);
		expect(second?.inHandAfterMulliganThenWin).toBe(1);
		expect(second?.drawnBeforeMulligan).toBe(0);
		expect(second?.drawn).toBe(0);
	});

	it('skips matches without cardsAnalysis', () => {
		const result = aggregatePersonalCardMulliganData([
			{ result: 'won' },
			{ result: 'won', cardsAnalysis: [] },
			{ result: 'lost', cardsAnalysis: null },
		]);
		expect(result).toEqual([]);
	});
});

describe('buildMulliganCardAdvice', () => {
	it('uses personal baseline winrate for impact and falls back to null without samples', () => {
		const advice = buildMulliganCardAdvice(
			['EX1_001', 'EX1_002'],
			[
				{
					cardId: 'EX1_001',
					drawnBeforeMulligan: 4,
					keptInMulligan: 2,
					inHandAfterMulligan: 2,
					inHandAfterMulliganThenWin: 2,
					drawn: 4,
					drawnThenWin: 3,
				},
			],
			0.5,
			(cardId, cardsData) => cardsData.find((c) => c.cardId === cardId),
		);

		expect(advice[0].keepRate).toBe(0.5);
		expect(advice[0].score).toBeCloseTo(50);
		expect(advice[0].drawnWinrateImpact).toBeCloseTo(0.25);
		expect(advice[1].keepRate).toBeNull();
		expect(advice[1].score).toBeNull();
		expect(advice[1].drawnWinrateImpact).toBeNull();
	});
});

describe('filterRelevantPlayerDeckMatches', () => {
	const match = (overrides: Partial<PlayerDeckMatchFilterInput>): PlayerDeckMatchFilterInput => ({
		gameFormat: 'standard',
		coinPlay: 'play',
		opponentClass: 'mage',
		result: 'won',
		creationTimestamp: Date.now() - 24 * 60 * 60 * 1000,
		...overrides,
	});

	it('filters by opponent, format, play/coin, and time', () => {
		const matches = [
			match({ reviewId: 'keep' }),
			match({ reviewId: 'opp', opponentClass: 'warrior' }),
			match({ reviewId: 'format', gameFormat: 'wild' }),
			match({ reviewId: 'coin', coinPlay: 'coin' }),
			match({ reviewId: 'old', creationTimestamp: Date.now() - 10 * 24 * 60 * 60 * 1000 }),
		];
		const relevant = filterRelevantPlayerDeckMatches(
			matches,
			'mage',
			GameFormatEnum.FT_STANDARD,
			'play',
			'past-7',
			null,
		);
		expect(relevant.map((m) => m.reviewId)).toEqual(['keep']);
	});

	it('returns empty when there is no personal sample', () => {
		expect(filterRelevantPlayerDeckMatches([], 'all', GameFormatEnum.FT_STANDARD, 'all', 'past-7', null)).toEqual(
			[],
		);
	});
});

describe('match filters', () => {
	it('isCorrectFormat / playCoin / time', () => {
		const now = Date.now();
		const ranked: PlayerDeckMatchFilterInput = {
			gameFormat: 'standard',
			coinPlay: 'coin',
			creationTimestamp: now,
			result: 'won',
		};
		expect(isCorrectFormat(ranked, GameFormatEnum.FT_STANDARD)).toBe(true);
		expect(isCorrectFormat(ranked, GameFormatEnum.FT_WILD)).toBe(false);
		expect(isCorrectFormat({ ...ranked, gameFormat: 'twist' }, GameFormatEnum.FT_TWIST)).toBe(true);
		expect(isCorrectPlayCoin(ranked, 'all')).toBe(true);
		expect(isCorrectPlayCoin(ranked, 'coin')).toBe(true);
		expect(isCorrectPlayCoin(ranked, 'play')).toBe(false);
		expect(isCorrectTime(ranked, 'past-3', null)).toBe(true);
		expect(isCorrectTime(ranked, 'last-patch', null)).toBe(false);
		expect(
			isCorrectTime(ranked, 'last-patch', {
				number: 1,
				version: '1',
				name: 'test',
				date: new Date(now - 1000).toISOString(),
				hasNewBuildNumber: false,
			} as PatchInfo),
		).toBe(true);
	});
});

describe('isSamePlayerDecklist', () => {
	it('matches exact strings and normalized equivalents', () => {
		const normalize = (deckstring: string) => (deckstring.startsWith('raw-') ? deckstring.slice(4) : deckstring);
		expect(isSamePlayerDecklist('AAE', 'AAE', normalize)).toBe(true);
		expect(isSamePlayerDecklist('raw-AAE', 'AAE', normalize)).toBe(true);
		expect(isSamePlayerDecklist('raw-AAE', 'raw-AAE', normalize)).toBe(true);
		expect(isSamePlayerDecklist('AAE', 'OTHER', normalize)).toBe(false);
		expect(isSamePlayerDecklist(null, 'AAE', normalize)).toBe(false);
	});
});

describe('chunkReviewIds', () => {
	it('splits ids into batches', () => {
		expect(chunkReviewIds(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
		expect(chunkReviewIds([], 2)).toEqual([]);
	});
});

describe('meetsPersonalMinGames', () => {
	it('gates personal stats by the overlay preference', () => {
		expect(meetsPersonalMinGames(0, 'always')).toBe(false);
		expect(meetsPersonalMinGames(1, 'always')).toBe(true);
		expect(meetsPersonalMinGames(100, 'never')).toBe(false);
		expect(meetsPersonalMinGames(24, '25')).toBe(false);
		expect(meetsPersonalMinGames(25, '25')).toBe(true);
		expect(meetsPersonalMinGames(24, null)).toBe(false);
		expect(meetsPersonalMinGames(25, null)).toBe(true);
	});
});

describe('mergeCommunityAndPersonalAdvice', () => {
	it('attaches personal keep/impact onto community rows', () => {
		const merged = mergeCommunityAndPersonalAdvice(
			[
				{
					cardId: 'EX1_001',
					score: 1,
					keepRate: 0.4,
					drawnWinrateImpact: 0.1,
				},
			],
			[
				{
					cardId: 'EX1_001',
					score: 5,
					keepRate: 0.8,
					drawnWinrateImpact: 0.2,
				},
			],
		);
		expect(merged[0].keepRate).toBe(0.4);
		expect(merged[0].score).toBe(1);
		expect(merged[0].personalKeepRate).toBe(0.8);
		expect(merged[0].personalScore).toBe(5);
	});
});
