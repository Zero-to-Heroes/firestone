import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { StandardRankedMinRankReq } from './standard-ranked-min-rank-req';

describe('standard-ranked-min-rank-req', () => {
	describe('game type is ranked', () => {
		test('is completed when standard player rank is equal to required rank', () => {
			const req = new StandardRankedMinRankReq(19);
			const rankedEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: { metaData: { GameType: 5 } },
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
				additionalData: { metaData: { GameType: 5 } },
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
				additionalData: { metaData: { GameType: 5 } },
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
			const req = new StandardRankedMinRankReq(19);
			const rankedEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: { metaData: { GameType: 5 } },
			} as GameEvent);
			const playerInfoEvent = Object.assign(new GameEvent(), {
				type: GameEvent.LOCAL_PLAYER,
				localPlayer: { standardRank: 22 },
			} as GameEvent);

			req.test(rankedEvent);
			req.test(playerInfoEvent);

			expect(req.isCompleted()).toBeFalsy;
		});
	});

	describe('game type is not ranked', () => {
		test('is completed when player rank is lower (stronger) than required rank', () => {
			const req = new StandardRankedMinRankReq(19);
			const nonRankedEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: { metaData: { GameType: 6 } },
			} as GameEvent);
			const playerInfoEvent = Object.assign(new GameEvent(), {
				type: GameEvent.LOCAL_PLAYER,
				localPlayer: { standardRank: 19 },
			} as GameEvent);

			req.test(nonRankedEvent);
			req.test(playerInfoEvent);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when player rank is lower (stronger) than required rank', () => {
			const req = new StandardRankedMinRankReq(19);
			const nonRankedEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: { metaData: { GameType: 6 } },
			} as GameEvent);
			const playerInfoEvent = Object.assign(new GameEvent(), {
				type: GameEvent.LOCAL_PLAYER,
				localPlayer: { standardRank: 2 },
			} as GameEvent);

			req.test(nonRankedEvent);
			req.test(playerInfoEvent);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when player rank is greater (weaker) than required rank', () => {
			const req = new StandardRankedMinRankReq(19);
			const nonRankedEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: { metaData: { GameType: 6 } },
			} as GameEvent);
			const playerInfoEvent = Object.assign(new GameEvent(), {
				type: GameEvent.LOCAL_PLAYER,
				localPlayer: { standardRank: 22 },
			} as GameEvent);

			req.test(nonRankedEvent);
			req.test(playerInfoEvent);

			expect(req.isCompleted()).toBe(true);
		});
	});

	test('req is intantiated with the correct target rank', () => {
		const rawReq: RawRequirement = {
			'type': 'RANKED_MIN_RANK',
			'values': ['19'],
		};

		const req = StandardRankedMinRankReq.create(rawReq);

		expect(req['taregetRank']).toEqual(19);
	});
});
