import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { HealthAtEndReq } from './health-at-end-req';

describe('health-at-end-req', () => {
	describe('qualifier is absent (exact match)', () => {
		test('is completed when health at end is the target health', () => {
			const req = new HealthAtEndReq(1, '');
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
			const req = new HealthAtEndReq(1, '');
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
			const req = new HealthAtEndReq(30, '');
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
		describe('qualifier is AT_MOST', () => {
			test('is completed when health at end is the target health', () => {
				const req = new HealthAtEndReq(3, 'AT_MOST');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.GAME_END,
					additionalData: {
						report: {
							LocalPlayer: {
								TotalHealth: 30,
								DamageTaken: 27,
							},
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed even if there is some armor left', () => {
				const req = new HealthAtEndReq(3, 'AT_MOST');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.GAME_END,
					additionalData: {
						report: {
							LocalPlayer: {
								TotalHealth: 30,
								DamageTaken: 27,
								ArmorLeft: 30,
							},
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when health is higher than target health', () => {
				const req = new HealthAtEndReq(3, 'AT_MOST');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.GAME_END,
					additionalData: {
						report: {
							LocalPlayer: {
								TotalHealth: 30,
								DamageTaken: 25,
							},
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is completed when health is lower than target health', () => {
				const req = new HealthAtEndReq(3, 'AT_MOST');
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
		});
	});

	test('req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'HEALTH_AT_END',
			'values': ['1', 'AT_MOST'],
		};

		const req = HealthAtEndReq.create(rawReq);

		expect(req['targetHealth']).toBe(1);
		expect(req['qualifier']).toBe('AT_MOST');
	});
});
