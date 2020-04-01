import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { StandardRankedMinLeagueReq } from './standard-ranked-min-rank-req';

describe('standard-ranked-min-rank-req', () => {
	test('is completed when standard player rank is equal to required rank', () => {
		const req = new StandardRankedMinLeagueReq(4);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standard: { leagueId: 4 } },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when player rank is lower (stronger) than required rank', () => {
		const req = new StandardRankedMinLeagueReq(4);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standard: { leagueId: 3 } },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when player has legend ranking and target rank is not legend', () => {
		const req = new StandardRankedMinLeagueReq(4);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standard: { legendRank: 200 } },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when player rank is greater (weaker) than required rank', () => {
		const req = new StandardRankedMinLeagueReq(1);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standard: { leagueId: 4 } },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when game type is not ranked', () => {
		const req = new StandardRankedMinLeagueReq(4);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 6, FormatType: 2 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standard: { leagueId: 4 } },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when format type is not standard', () => {
		const req = new StandardRankedMinLeagueReq(4);
		const rankedEvent = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: { metaData: { GameType: 7, FormatType: 1 } },
		} as GameEvent);
		const playerInfoEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER,
			localPlayer: { standard: { leagueId: 4 } },
		} as GameEvent);

		req.test(rankedEvent);
		req.test(playerInfoEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target rank', () => {
		const rawReq: RawRequirement = {
			'type': 'RANKED_MIN_LEAGUE',
			'values': ['19'],
		};

		const req = StandardRankedMinLeagueReq.create(rawReq);

		expect(req['targetRank']).toEqual(19);
	});
});
