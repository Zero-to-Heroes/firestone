import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { TotalDamageDealtReq } from './total-damage-dealt-req';

describe('total-damage-dealt-req', () => {
	describe('no damage source card', () => {
		describe('qualifier is AT_LEAST', () => {
			test('is completed when total damage is equal to target total damage', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceControllerId: 2,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 2 },
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});

			test('is completed when total damage is greater than target total damage', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceControllerId: 2,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 4 },
						},
					},
				} as GameEvent);

				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});

			test('is not completed when total damage is less than target total damage', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceControllerId: 2,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 1 },
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});

			test('only damage dealt by source we control is taken into account', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceControllerId: 1,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 4 },
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});

			test('is completed when expecting 0 damage and no damage is dealt', () => {
				const req = new TotalDamageDealtReq(0, 'AT_LEAST');
				expect(req.isCompleted()).toBe(true);
			});
		});
	});

	describe('source card', () => {
		describe('qualifier is AT_LEAST', () => {
			test('is completed when total damage is equal to target total damage', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST', 'AT_001');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceControllerId: 2,
						sourceCardId: 'AT_001',
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 2 },
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});

			test('is completed when total damage is greater than target total damage', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST', 'AT_001');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceCardId: 'AT_001',
						sourceControllerId: 2,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 4 },
						},
					},
				} as GameEvent);

				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});

			test('is not completed when total damage is less than target total damage', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST', 'AT_001');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceCardId: 'AT_001',
						sourceControllerId: 2,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 1 },
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});

			test('only damage dealt by source we control is taken into account', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST', 'AT_001');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceCardId: 'AT_001',
						sourceControllerId: 1,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 4 },
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});

			test('only damage dealt the correct source card id is taken into account', () => {
				const req = new TotalDamageDealtReq(4, 'AT_LEAST', 'AT_001');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.DAMAGE,
					localPlayer: { PlayerId: 2 },
					additionalData: {
						sourceCardId: 'AT_002',
						sourceControllerId: 2,
						targets: {
							CARD_1: { Damage: 2 },
							CARD_2: { Damage: 4 },
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});

			test('is completed when expecting 0 damage and no damage is dealt', () => {
				const req = new TotalDamageDealtReq(0, 'AT_LEAST', 'AT_001');
				expect(req.isCompleted()).toBe(true);
			});
		});
	});

	test('req is intantiated with the correct target total damage and qualifier', () => {
		const rawReq: RawRequirement = {
			'type': 'TOTAL_DAMAGE_DEALT',
			'values': ['1', 'AT_LEAST'],
		};

		const req = TotalDamageDealtReq.create(rawReq);

		expect(req['targetDamage']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['sourceCardId']).toBe(undefined);
	});

	test('req is intantiated with the correct target total damage, qualifier and source damage card', () => {
		const rawReq: RawRequirement = {
			'type': 'TOTAL_DAMAGE_DEALT',
			'values': ['1', 'AT_LEAST', 'AT_001'],
		};

		const req = TotalDamageDealtReq.create(rawReq);

		expect(req['targetDamage']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['sourceCardId']).toBe('AT_001');
	});
});
