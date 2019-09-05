import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { TotalArmorGainReq } from './total-armor-gain-req';

describe('total-armor-gain-req', () => {
	describe('qualifier is AT_LEAST', () => {
		test('is completed when total armor gained is equal to target total armor gained when armor gained is done in a single blow', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: 4,
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when total armor gained is equal to target total armor gained when armor gained is done over multiple blows', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: 2,
				},
			} as GameEvent);

			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when total armor gained is greater than target total armor gained when armor gained is done in a single blow', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: 5,
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when total armor gained is greater than target total armor gained when armor gained is done over multiple blows', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: 2,
				},
			} as GameEvent);

			req.test(event);
			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when expecting 0 armor gained and no armor gained is received', () => {
			const req = new TotalArmorGainReq(0, 'AT_LEAST');
			expect(req.isCompleted()).toBe(true);
		});

		test('is not completed when total armor gained is less than target total armor gained when armor gained is done in a single blow', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: 2,
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});

		test('is not completed when total armor gained is less than target total armor gained when armor gained is done over multiple blows', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: 1,
				},
			} as GameEvent);

			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});

		test('is completed when total armor gained is greater or equal than target total armor gained even if there are armor losses', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const eventGain = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: 4,
				},
			} as GameEvent);
			const eventLoss = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: -4,
				},
			} as GameEvent);

			req.test(eventGain);
			req.test(eventLoss);

			expect(req.isCompleted()).toBe(true);
		});

		test('is not completed when receiving correct amount but as a loss', () => {
			const req = new TotalArmorGainReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ARMOR_CHANGED,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					armorChange: -4,
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('req is intantiated with the correct target armor gained and qualifier', () => {
		const rawReq: RawRequirement = {
			'type': 'TOTAL_ARMOR_GAINED',
			'values': ['1', 'AT_LEAST'],
		};

		const req = TotalArmorGainReq.create(rawReq);

		expect(req['targetArmor']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
