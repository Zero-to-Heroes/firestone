import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { FatigueDamageReq } from './fatigue-damage-req';

describe('fatigue-damage-req', () => {
	describe('qualifier is AT_LEAST', () => {
		describe('player is OPPONENT', () => {
			test('is completed when fatigue damage is exactly target damage', () => {
				const req = new FatigueDamageReq(3, 'AT_LEAST', 'OPPONENT');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.FATIGUE_DAMAGE,
					opponentPlayer: {
						Id: 2,
					},
					additionalData: {
						fatigueDamage: 3,
						entityId: 2,
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when fatigue damage is exactly target damage in several shots', () => {
				const req = new FatigueDamageReq(4, 'AT_LEAST', 'OPPONENT');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.FATIGUE_DAMAGE,
					opponentPlayer: {
						Id: 2,
					},
					additionalData: {
						fatigueDamage: 3,
						entityId: 2,
					},
				} as GameEvent);

				req.test(event);
				expect(req.isCompleted()).toBeFalsy();
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when fatigue damage is graeter than target damage', () => {
				const req = new FatigueDamageReq(3, 'AT_LEAST', 'OPPONENT');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.FATIGUE_DAMAGE,
					opponentPlayer: {
						Id: 2,
					},
					additionalData: {
						fatigueDamage: 5,
						entityId: 2,
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when fatigue damage is greater than target damage in several shots', () => {
				const req = new FatigueDamageReq(4, 'AT_LEAST', 'OPPONENT');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.FATIGUE_DAMAGE,
					opponentPlayer: {
						Id: 2,
					},
					additionalData: {
						fatigueDamage: 3,
						entityId: 2,
					},
				} as GameEvent);

				req.test(event);
				expect(req.isCompleted()).toBeFalsy();
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when fatigue damage is less than target damage', () => {
				const req = new FatigueDamageReq(3, 'AT_LEAST', 'OPPONENT');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.FATIGUE_DAMAGE,
					opponentPlayer: {
						Id: 2,
					},
					additionalData: {
						fatigueDamage: 2,
						entityId: 2,
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when fatigue damage is taken by the player', () => {
				const req = new FatigueDamageReq(3, 'AT_LEAST', 'OPPONENT');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.FATIGUE_DAMAGE,
					opponentPlayer: {
						Id: 2,
					},
					additionalData: {
						fatigueDamage: 10,
						entityId: 1,
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});
	});

	test('req is intantiated with the correct target damage', () => {
		const rawReq: RawRequirement = {
			'type': 'FATIGUE_DAMAGE',
			'values': ['1', 'AT_LEAST', 'OPPONENT'],
		};

		const req = FatigueDamageReq.create(rawReq);

		expect(req['targetDamage']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['player']).toBe('OPPONENT');
	});
});
