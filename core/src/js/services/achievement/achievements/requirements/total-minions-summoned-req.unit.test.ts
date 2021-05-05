import { CardIds } from '@firestone-hs/reference-data';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { buildTestCardsService } from '../../../test-utils';
import { TotalMinionsSummonedReq } from './total-minions-summoned-req';

describe('total-minions-summoned-req', () => {
	const cards = buildTestCardsService();

	describe('qualifier is AT_MOST', () => {
		test('is completed when the required number of minions have been summoned', () => {
			const req = new TotalMinionsSummonedReq(2, 'AT_MOST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.MINION_SUMMONED,
				cardId: CardIds.Collectible.Mage.ManaWyrm,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
			} as GameEvent);

			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});
		test('is completed when fewer than the required number of minions have been summoned', () => {
			const req = new TotalMinionsSummonedReq(2, 'AT_MOST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.MINION_SUMMONED,
				cardId: CardIds.Collectible.Mage.ManaWyrm,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});
		test('is completed when no minion has been summoned', () => {
			const req = new TotalMinionsSummonedReq(2, 'AT_MOST', cards);
			expect(req.isCompleted()).toBe(true);
		});
		test('is not completed when too many minions have been summoned', () => {
			const req = new TotalMinionsSummonedReq(2, 'AT_MOST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.MINION_SUMMONED,
				cardId: CardIds.Collectible.Mage.ManaWyrm,
				controllerId: 1,
				localPlayer: { PlayerId: 1 },
			} as GameEvent);

			req.test(event);
			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
		test('opponent summoning a minion does not prevent completion', () => {
			const req = new TotalMinionsSummonedReq(2, 'AT_MOST', cards);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.CARD_PLAYED,
				cardId: CardIds.Collectible.Mage.ManaWyrm,
				controllerId: 2,
				localPlayer: { PlayerId: 1 },
			} as GameEvent);

			req.test(event);
			req.test(event);
			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});
	});

	test('total-minions-summoned-req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'TOTAL_MINIONS_SUMMONED',
			'values': ['4', 'AT_MOST'],
		};

		const req = TotalMinionsSummonedReq.create(rawReq, cards);

		expect(req['targetQuantity']).toBe(4);
		expect(req['qualifier']).toBe('AT_MOST');
	});
});
