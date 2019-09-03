import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { TotalDamageTakenReq } from './total-damage-taken-req';

describe('total-damage-taken-req', () => {
	test('is completed when total damage taken is equal to target total damage taken when damage is dealt in a single blow', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when total damage taken is equal to target total damage taken when damage is dealt over multiple blows', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_07': { 'Damage': 2, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);
		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when expecting 0 damage taken and no damage is received', () => {
		const req = new TotalDamageTakenReq(0);
		expect(req.isCompleted()).toBe(true);

		// Damage dealt to another entity
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_01': { 'Damage': 2, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);
		req.test(event);
		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when total damage taken is not to target total damage taken when damage is dealt in a single blow', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_07': { 'Damage': 2, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when total damage taken is not to target total damage taken when damage is dealt over multiple blows', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);
		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is completed when total fatigue damage matches expected damage in a single blow', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.FATIGUE_DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: { playerId: 2, fatigueDamage: 4 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when total fatigue damage matches expected damage over multiple blows', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.FATIGUE_DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: { playerId: 2, fatigueDamage: 2 },
		} as GameEvent);

		req.test(event);
		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when total fatigue damage + total damage matches expected damage over multiple blows', () => {
		const req = new TotalDamageTakenReq(4);
		const fatigueEvent = Object.assign(new GameEvent(), {
			type: GameEvent.FATIGUE_DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: { playerId: 2, fatigueDamage: 2 },
		} as GameEvent);
		const damageEvent = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_07': { 'Damage': 2, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(fatigueEvent);
		req.test(damageEvent);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when total fatigue damage taken is not to target total damage taken when damage is dealt in a single blow', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.FATIGUE_DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: { playerId: 2, fatigueDamage: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when total damage taken is not to target total damage taken when damage is dealt over multiple blows', () => {
		const req = new TotalDamageTakenReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_07': { 'Damage': 4, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(event);
		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is completed when total fatigue damage + total damage does not match the expected damage over multiple blows', () => {
		const req = new TotalDamageTakenReq(4);
		const fatigueEvent = Object.assign(new GameEvent(), {
			type: GameEvent.FATIGUE_DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: { playerId: 2, fatigueDamage: 4 },
		} as GameEvent);
		const damageEvent = Object.assign(new GameEvent(), {
			type: GameEvent.DAMAGE,
			localPlayer: { PlayerId: 2, CardID: 'HERO_07' },
			additionalData: {
				targets: {
					'HERO_07': { 'Damage': 2, 'TargetControllerId': 2 },
				},
			},
		} as GameEvent);

		req.test(fatigueEvent);
		req.test(damageEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target damage', () => {
		const rawReq: RawRequirement = {
			'type': 'DAMAGE_AT_END',
			'values': ['1'],
		};

		const req = TotalDamageTakenReq.create(rawReq);

		expect(req['targetDamage']).toBe(1);
	});
});
