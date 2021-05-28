import { CardIds, CardType } from '@firestone-hs/reference-data';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { buildTestCardsService } from '../../../test-utils';
import { CardWithSameAttributePlayedReq } from './card-with-same-attribute-played-req';

describe('card-with-same-attribute-played-req', () => {
	const cards = buildTestCardsService();

	describe('qualifier is AT_LEAST', () => {
		describe('card type is SPELL', () => {
			describe('attribute is NAME', () => {
				test('is completed when the required number of spells with the same name have been played', () => {
					const req = new CardWithSameAttributePlayedReq(2, 'AT_LEAST', 'NAME', 'SPELL', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.CARD_PLAYED,
						cardId: CardIds.Collectible.Mage.FireballLegacy,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
					} as GameEvent);

					req.test(event);
					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});
				test('is not completed when the card has echo', () => {
					const req = new CardWithSameAttributePlayedReq(2, 'AT_LEAST', 'NAME', 'SPELL', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.CARD_PLAYED,
						cardId: CardIds.Collectible.Paladin.SoundTheBells,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
					} as GameEvent);

					req.test(event);
					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('is not completed when the card is not a spell', () => {
					const req = new CardWithSameAttributePlayedReq(2, 'AT_LEAST', 'NAME', 'SPELL', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.CARD_PLAYED,
						cardId: CardIds.Collectible.Mage.ManaWyrmLegacy,
						controllerId: 1,
						localPlayer: { PlayerId: 1 },
					} as GameEvent);

					req.test(event);
					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('is not completed when the cards dont have the same name', () => {
					const req = new CardWithSameAttributePlayedReq(2, 'AT_LEAST', 'NAME', 'SPELL', cards);

					req.test(
						Object.assign(new GameEvent(), {
							type: GameEvent.CARD_PLAYED,
							cardId: CardIds.Collectible.Mage.FireballLegacy,
							controllerId: 1,
							localPlayer: { PlayerId: 1 },
						} as GameEvent),
					);
					req.test(
						Object.assign(new GameEvent(), {
							type: GameEvent.CARD_PLAYED,
							cardId: CardIds.Collectible.Mage.RollingFireball,
							controllerId: 1,
							localPlayer: { PlayerId: 1 },
						} as GameEvent),
					);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('is not completed when the opponent plays the cards', () => {
					const req = new CardWithSameAttributePlayedReq(2, 'AT_LEAST', 'NAME', 'SPELL', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.CARD_PLAYED,
						cardId: CardIds.Collectible.Mage.FireballLegacy,
						controllerId: 2,
						localPlayer: { PlayerId: 1 },
					} as GameEvent);

					req.test(event);
					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
			});
		});
	});

	test('card-with-same-attribute-played-req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'CARDS_WITH_SAME_ATTRIBUTE_PLAYED',
			'values': ['4', 'AT_LEAST', 'NAME', 'SPELL'],
		};

		const req = CardWithSameAttributePlayedReq.create(rawReq, cards);

		expect(req['targetQuantity']).toBe(4);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['attribute']).toBe('name');
		expect(req['cardType']).toBe(CardType.SPELL);
	});
});
