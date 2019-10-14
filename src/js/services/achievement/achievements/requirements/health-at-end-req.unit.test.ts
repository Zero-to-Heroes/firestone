import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { HealthAtEndReq } from './health-at-end-req';

describe('health-at-end-req', () => {
	test('is completed when health at end is the target health', () => {
		const req = new HealthAtEndReq(1);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						TotalHealth: 30,
						DamageTaken: 29,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is completed even if there is some armor left', () => {
		const req = new HealthAtEndReq(1);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						TotalHealth: 30,
						DamageTaken: 29,
						ArmorLeft: 30,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when health does not match target health', () => {
		const req = new HealthAtEndReq(30);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
			additionalData: {
				report: {
					LocalPlayer: {
						TotalHealth: 30,
						DamageTaken: 29,
					},
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target health', () => {
		const rawReq: RawRequirement = {
			'type': 'HEALTH_AT_END',
			'values': ['1'],
		};

		const req = HealthAtEndReq.create(rawReq);

		expect(req['targetHealth']).toBe(1);
	});
});
