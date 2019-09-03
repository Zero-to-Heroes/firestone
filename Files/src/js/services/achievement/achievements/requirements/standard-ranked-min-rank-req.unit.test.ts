import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { StandardRankedMinRankReq } from './standard-ranked-min-rank-req';

describe('standard-ranked-min-rank-req', () => {
	test('is completed when standard player rank is equal to required rank', () => {
		const req = new StandardRankedMinRankReq(19);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standardRank: 19 },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when player rank is lower (stronger) than required rank', () => {
		const req = new StandardRankedMinRankReq(19);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standardRank: 6 },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when player has legend ranking and target rank is not legend', () => {
		const req = new StandardRankedMinRankReq(19);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standardLegendRank: 200 },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when player rank is greater (weaker) than required rank', () => {
		const req = new StandardRankedMinRankReq(1);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standardRank: 20 },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when game type is not ranked', () => {
		const req = new StandardRankedMinRankReq(20);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 6, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standardRank: 10 },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when format type is not standard', () => {
		const req = new StandardRankedMinRankReq(20);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 1 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standardRank: 10 },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target rank', () => {
		const rawReq: RawRequirement = {
			'type': 'RANKED_MIN_RANK',
			'values': ['19'],
		};

		const req = StandardRankedMinRankReq.create(rawReq);

		expect(req['targetRank']).toEqual(19);
	});
});
