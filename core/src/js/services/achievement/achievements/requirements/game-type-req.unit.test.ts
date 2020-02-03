import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameTypeReq } from './game-type-req';

describe('game-type-req', () => {
	describe('single valid game type', () => {
		test('is completed when event has correct game type', () => {
			const req = new GameTypeReq([5]);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: {
					metaData: {
						GameType: 5,
					},
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});
		test('is not completed when event has incorrect game type', () => {
			const req = new GameTypeReq([5]);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: {
					metaData: {
						GameType: 7,
					},
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	describe('multiple valid game types', () => {
		test('is completed when event has correct game type', () => {
			const req = new GameTypeReq([5, 6]);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: {
					metaData: {
						GameType: 5,
					},
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});
		test('is not completed when event has incorrect game type', () => {
			const req = new GameTypeReq([5, 6]);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.MATCH_METADATA,
				additionalData: {
					metaData: {
						GameType: 7,
					},
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('req is intantiated with the correct cardId', () => {
		const rawReq: RawRequirement = {
			'type': 'GAME_TYPE',
			'values': ['5', '6'],
		};

		const req = GameTypeReq.create(rawReq);

		expect(req['gameTypes']).toEqual([5, 6]);
	});
});
