import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameMaxTurnsReq } from './game-max-turns-req';

describe('game-max-turns-req', () => {
	test('is completed when exactly enough turns haev been made', () => {
		const req = new GameMaxTurnsReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.TURN_START,
			additionalData: { turnNumber: 4 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when more turns have been made than specified', () => {
		const req = new GameMaxTurnsReq(3);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.TURN_START,
			additionalData: { turnNumber: 4 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is completed fewer turns have been made', () => {
		const req = new GameMaxTurnsReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.TURN_START,
			additionalData: { turnNumber: 3 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('req is intantiated with the correct target number of turns', () => {
		const rawReq: RawRequirement = {
			'type': 'GAME_MAX_TURN',
			'values': ['4'],
		};

		const req = GameMaxTurnsReq.create(rawReq);

		expect(req['targetTurn']).toBe(4);
	});
});
