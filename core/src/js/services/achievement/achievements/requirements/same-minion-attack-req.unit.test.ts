import { CardIds } from '@firestone-hs/reference-data';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { buildTestCardsService } from '../../../test-utils';
import { SameMinionAttackReq } from './same-minion-attack-req';

describe('same-minion-attack-req', () => {
	const cards = buildTestCardsService();

	describe('qualifier is AT_LEAST', () => {
		test('is completed when a single minion attacks the required number of times', () => {
			const req = new SameMinionAttackReq(2, 'AT_LEAST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ATTACKING_MINION,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					attackerCardId: CardIds.Collectible.Mage.ManaWyrmLegacy,
					attackerEntityId: 1,
					attackerControllerId: 1,
				},
			} as GameEvent);

			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});
		test('is completed when a single minion attacks more than the required number of times', () => {
			const req = new SameMinionAttackReq(2, 'AT_LEAST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ATTACKING_MINION,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					attackerCardId: CardIds.Collectible.Mage.ManaWyrmLegacy,
					attackerEntityId: 1,
					attackerControllerId: 1,
				},
			} as GameEvent);

			req.test(event);
			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});
		test('is not completed when a single minion attacks less than the required number of times', () => {
			const req = new SameMinionAttackReq(2, 'AT_LEAST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ATTACKING_MINION,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					attackerCardId: CardIds.Collectible.Mage.ManaWyrmLegacy,
					attackerEntityId: 1,
					attackerControllerId: 1,
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
		test('is not completed when a the hero attacks the required number of times', () => {
			const req = new SameMinionAttackReq(2, 'AT_LEAST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ATTACKING_MINION,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					attackerCardId: CardIds.Collectible.Warrior.GarroshHellscreamHeroSkins,
					attackerEntityId: 1,
					attackerControllerId: 1,
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
		test('cardId doesnt matter, entityId does', () => {
			const req = new SameMinionAttackReq(2, 'AT_LEAST', cards);

			req.test(
				Object.assign(new GameEvent(), {
					type: GameEvent.ATTACKING_MINION,
					localPlayer: { PlayerId: 1 },
					additionalData: {
						attackerCardId: CardIds.Collectible.Mage.ManaWyrmLegacy,
						attackerEntityId: 1,
						attackerControllerId: 1,
					},
				} as GameEvent),
			);
			req.test(
				Object.assign(new GameEvent(), {
					type: GameEvent.ATTACKING_MINION,
					localPlayer: { PlayerId: 1 },
					additionalData: {
						attackerCardId: CardIds.Collectible.Mage.ManaWyrmLegacy,
						attackerEntityId: 2,
						attackerControllerId: 1,
					},
				} as GameEvent),
			);

			expect(req.isCompleted()).toBeFalsy();
		});
		test('is not completed when a the minion is controlled by the opponent', () => {
			const req = new SameMinionAttackReq(2, 'AT_LEAST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.ATTACKING_MINION,
				localPlayer: { PlayerId: 1 },
				additionalData: {
					attackerCardId: CardIds.Collectible.Mage.ManaWyrmLegacy,
					attackerEntityId: 1,
					attackerControllerId: 2,
				},
			} as GameEvent);

			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('same-minion-attack-req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'SAME_MINION_ATTACK_TIMES',
			'values': ['4', 'AT_LEAST'],
		};

		const req = SameMinionAttackReq.create(rawReq, cards);

		expect(req['targetQuantity']).toBe(4);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
