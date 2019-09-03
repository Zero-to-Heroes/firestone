import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameMinTurnsReq } from './game-min-turns-req';

describe('game-min-turns-req', () => {
	test('is completed when exactly enough turns haev been made', () => {
		const req = new GameMinTurnsReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.TURN_START,
			additionalData: { turnNumber: 4 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is completed when more turns have been made than needed', () => {
		const req = new GameMinTurnsReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.TURN_START,
			additionalData: { turnNumber: 4 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed not enough turns have been made', () => {
		const req = new GameMinTurnsReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.TURN_START,
			additionalData: { turnNumber: 3 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target number of turns', () => {
		const rawReq: RawRequirement = {
			'type': 'GAME_MIN_TURNS',
			'values': ['4'],
		};

		const req = GameMinTurnsReq.create(rawReq);

		expect(req['targetTurn']).toBe(4);
	});
});
