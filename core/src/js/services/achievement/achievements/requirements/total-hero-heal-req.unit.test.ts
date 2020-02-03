import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { TotalHeroHealReq } from './total-hero-heal-req';

describe('total-hero-heal-req', () => {
	describe('qualifier is AT_LEAST', () => {
		test('is completed when total healing is equal to target total healing when healing is done in a single blow', () => {
			const req = new TotalHeroHealReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.HEALING,
				localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
				additionalData: {
					targets: {
						'HERO_07': { 'Healing': 4, 'TargetControllerId': 2 },
					},
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when total healing is equal to target total healing when healing is done over multiple blows', () => {
			const req = new TotalHeroHealReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.HEALING,
				localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
				additionalData: {
					targets: {
						'HERO_07': { 'Healing': 2, 'TargetControllerId': 2 },
					},
				},
			} as GameEvent);

			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when total healing is greater than target total healing when healing is done in a single blow', () => {
			const req = new TotalHeroHealReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.HEALING,
				localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
				additionalData: {
					targets: {
						'HERO_07': { 'Healing': 6, 'TargetControllerId': 2 },
					},
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when total healing is greater than target total healing when healing is done over multiple blows', () => {
			const req = new TotalHeroHealReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.HEALING,
				localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
				additionalData: {
					targets: {
						'HERO_07': { 'Healing': 2, 'TargetControllerId': 2 },
					},
				},
			} as GameEvent);

			req.test(event);
			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when expecting 0 healing and no healing is received', () => {
			const req = new TotalHeroHealReq(0, 'AT_LEAST');
			expect(req.isCompleted()).toBe(true);

			// Damage dealt to another entity
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.HEALING,
				localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
				additionalData: {
					targets: {
						'HERO_01': { 'Healing': 2, 'TargetControllerId': 2 },
					},
				},
			} as GameEvent);
			req.test(event);
			expect(req.isCompleted()).toBe(true);
		});

		test('is not completed when total healing is less than target total healing when healing is done in a single blow', () => {
			const req = new TotalHeroHealReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.HEALING,
				localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
				additionalData: {
					targets: {
						'HERO_07': { 'Healing': 2, 'TargetControllerId': 2 },
					},
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});

		test('is not completed when total healing is less than target total healing when healing is done over multiple blows', () => {
			const req = new TotalHeroHealReq(4, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.HEALING,
				localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
				additionalData: {
					targets: {
						'HERO_07': { 'Healing': 1, 'TargetControllerId': 2 },
					},
				},
			} as GameEvent);

			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('req is intantiated with the correct target healing and qualifier', () => {
		const rawReq: RawRequirement = {
			'type': 'TOTAL_HERO_HEAL',
			'values': ['1', 'AT_LEAST'],
		};

		const req = TotalHeroHealReq.create(rawReq);

		expect(req['targetHealing']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
