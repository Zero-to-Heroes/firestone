import { CardIds } from '@firestone-hs/reference-data';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { buildTestCardsService } from '../../../test-utils';
import { TotalCardsPlayedReq } from './total-cards-played-req';

describe('total-cards-played-req', () => {
	const cards = buildTestCardsService();

	describe('qualifier is AT_LEAST', () => {
		describe('card type is SECRET', () => {
			test('is completed when the required number of secrets have been played', () => {
				const req = new TotalCardsPlayedReq(2, 'AT_LEAST', 'SECRET', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.MirrorEntityLegacy,
					controllerId: 1,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when not enough secrets have been played', () => {
				const req = new TotalCardsPlayedReq(3, 'AT_LEAST', 'SECRET', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.MirrorEntityLegacy,
					controllerId: 1,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when the card is not a secret', () => {
				const req = new TotalCardsPlayedReq(2, 'AT_LEAST', 'SECRET', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.FireballLegacy,
					controllerId: 1,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when the opponent plays the cards', () => {
				const req = new TotalCardsPlayedReq(2, 'AT_LEAST', 'SECRET', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.MirrorEntityLegacy,
					controllerId: 2,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});
	});

	describe('qualifier is AT_MOST', () => {
		describe('card type is SPELL', () => {
			test('is completed when the required number of spells have been played', () => {
				const req = new TotalCardsPlayedReq(2, 'AT_MOST', 'SPELL', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.FireballLegacy,
					controllerId: 1,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('secrets count as spells', () => {
				const req = new TotalCardsPlayedReq(2, 'AT_MOST', 'SPELL', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.MirrorEntityLegacy,
					controllerId: 1,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when too many spells have been played', () => {
				const req = new TotalCardsPlayedReq(3, 'AT_MOST', 'SPELL', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.FireballLegacy,
					controllerId: 1,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);
				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when the card is not a spell', () => {
				const req = new TotalCardsPlayedReq(2, 'AT_MOST', 'SPELL', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.ManaWyrmLegacy,
					controllerId: 1,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('opponents playing cards does not prevent completion', () => {
				const req = new TotalCardsPlayedReq(2, 'AT_MOST', 'SPELL', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.CARD_PLAYED,
					cardId: CardIds.FireballLegacy,
					controllerId: 2,
					localPlayer: { PlayerId: 1 },
				} as GameEvent);

				req.test(event);
				req.test(event);
				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
		});
	});

	test('total-cards-played-req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'TOTAL_CARDS_PLAYED',
			'values': ['4', 'AT_LEAST', 'SECRET'],
		};

		const req = TotalCardsPlayedReq.create(rawReq, cards);

		expect(req['targetQuantity']).toBe(4);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['cardType']).toBe('SECRET');
	});
});
