import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { ArmorAtEndReq } from './armor-at-end-req';

describe('armor-at-end-req', () => {
	test('is completed when armor at end is the target armor', () => {
		const req = new ArmorAtEndReq(1);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						ArmorLeft: 1,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when armor does not match target armor', () => {
		const req = new ArmorAtEndReq(0);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						ArmorLeft: 1,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct armor target', () => {
		const rawReq: RawRequirement = {
			'type': 'ARMOR_AT_END',
			'values': ['1'],
		};

		const req = ArmorAtEndReq.create(rawReq);

		expect(req['targetArmor']).toBe(1);
	});
});
