import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent, GameState } from '../../../../models/game-event';
import { MinionAttackReq } from './minion-attack-req';

describe('minion-attack-req', () => {
	describe('qualifier is AT_LEAST', () => {
		describe('no minion ID is specified', () => {
			describe('minion on board attack is updated', () => {
				test('is completed when any minion on board has exactly the required attack ', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_ON_BOARD_ATTACK_UPDATED,
						cardId: 'any',
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						additionalData: { newAttack: 100 },
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});
				test('is completed when any minion s attack on board is greater than the required attack ', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_ON_BOARD_ATTACK_UPDATED,
						cardId: 'any',
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						additionalData: { newAttack: 101 },
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});
				test('is not completed when any minion s attack on board is lower than the required attack ', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_ON_BOARD_ATTACK_UPDATED,
						cardId: 'any',
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						additionalData: { newAttack: 99 },
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('is not completed when the minion is not controlled by the local player', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_ON_BOARD_ATTACK_UPDATED,
						cardId: 'any',
						controllerId: 1,
						localPlayer: { PlayerId: 2 },
						additionalData: { newAttack: 101 },
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
			});
			describe('minion is summoned ', () => {
				test('is completed when any minion summoned has exactly the right attack', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_SUMMONED,
						cardId: 'any',
						entityId: 99,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						gameState: ({
							Player: {
								Board: [
									{
										entityId: 99,
										cardId: 'any',
										attack: 100,
									},
								],
							},
						} as unknown) as GameState,
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});
				test('is completed when any minion summoned has more than the right attack', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_SUMMONED,
						cardId: 'any',
						entityId: 99,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						gameState: ({
							Player: {
								Board: [
									{
										entityId: 99,
										cardId: 'any',
										attack: 101,
									},
								],
							},
						} as unknown) as GameState,
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});
				test('is not completed when any minion summoned has less than the right attack', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_SUMMONED,
						cardId: 'any',
						entityId: 99,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						gameState: ({
							Player: {
								Board: [
									{
										entityId: 99,
										cardId: 'any',
										attack: 99,
									},
								],
							},
						} as unknown) as GameState,
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('is not when we summon a minion with an invalid attack and a minion with the same cardId is on board', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_SUMMONED,
						cardId: 'any',
						entityId: 99,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						gameState: ({
							Player: {
								Board: [
									{
										entityId: 998,
										cardId: 'any',
										attack: 100,
									},
									{
										entityId: 99,
										cardId: 'any',
										attack: 1,
									},
								],
							},
						} as unknown) as GameState,
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('is not completed when the minion is summed by the opponent', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_SUMMONED,
						cardId: 'any',
						entityId: 99,
						controllerId: 2,
						localPlayer: { PlayerId: 1 },
						gameState: ({
							Player: {
								Board: [
									{
										entityId: 99,
										cardId: 'any',
										attack: 101,
									},
								],
							},
						} as unknown) as GameState,
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('is not completed when the minion does not appera onthe board state', () => {
					const req = new MinionAttackReq(100, 'AT_LEAST');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.MINION_SUMMONED,
						cardId: 'any',
						entityId: 99,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
						gameState: ({
							Player: {
								Board: [],
							},
						} as unknown) as GameState,
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
			});
		});
	});

	test('req is intantiated with the correct target rank', () => {
		const rawReq: RawRequirement = {
			'type': 'MINION_ATTACK_ON_BOARD',
			'values': ['100', 'AT_LEAST'],
		};

		const req = MinionAttackReq.create(rawReq);

		expect(req['targetMinionAttack']).toBe(100);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
