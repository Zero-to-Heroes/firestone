import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { DamageAtEndReq } from './damage-at-end-req';

describe('damage-at-end-req', () => {
	test('is completed when damage at end is the target damage', () => {
		const req = new DamageAtEndReq(1);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						DamageTaken: 1,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is completed whatever health and armor is left', () => {
		const req = new DamageAtEndReq(1);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						TotalHealth: 30,
						DamageTaken: 1,
						ArmorLeft: 30,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when health does not match target health', () => {
		const req = new DamageAtEndReq(0);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						DamageTaken: 1,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target damage', () => {
		const rawReq: RawRequirement = {
			'type': 'DAMAGE_AT_END',
			'values': ['1'],
		};

		const req = DamageAtEndReq.create(rawReq);

		expect(req['targetDamage']).toBe(1);
	});
});
