import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { FormatTypeReq } from './format-type-req';

describe('format-type-req', () => {
	test('is completed when event has correct format type', () => {
		const req = new FormatTypeReq([2]);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: {
				metaData: {
					FormatType: 2,
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when event has incorrect format type', () => {
		const req = new FormatTypeReq([5]);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MATCH_METADATA,
			additionalData: {
				metaData: {
					FormatType: 7,
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
});

test('req is intantiated with the correct format type', () => {
	const rawReq: RawRequirement = {
		'type': 'FORMAT_TYPE',
		'values': ['2'],
	};

	const req = FormatTypeReq.create(rawReq);

	expect(req['formatTypes']).toEqual([2]);
});
