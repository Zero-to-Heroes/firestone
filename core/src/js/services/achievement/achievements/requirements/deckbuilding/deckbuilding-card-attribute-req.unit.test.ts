import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingCardAttributeReq } from './deckbuilding-card-attribute-req';

describe('deckbuilding-card-attribute-req', () => {
	const cards = buildTestCardsService();

	describe('attribute is attack', () => {
		describe('attribute qualifier is AT_MOST', () => {
			describe('number of cards qualifier is AT_LEAST', () => {
				const deckstring15minions = 'AAECAZICAsmcA67SAg6zAfIBzpQDmA31Bf2nA6miA9WDA8CGA4vuAs+UA575Au2iA9kEAA==';

				test('is completed when deckstring contains exactly tbe number of cards with valid required attribute', () => {
					const req = new DeckbuildingCardAttributeReq(15, 'AT_LEAST', 'attack', 1, 'AT_MOST', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: {
							deck: {
								deckstring: deckstring15minions,
								deck: decode(deckstring15minions),
							},
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});
				test('is completed when deckstring contains more than tbe number of cards with valid required attribute', () => {
					const deckstring16minions =
						'AAECAZICBOUHyZwDwIYDrtICDbMB8gHOlAOYDfUF/acDqaID1YMDi+4Cz5QDnvkC7aID2QQA';
					const req = new DeckbuildingCardAttributeReq(15, 'AT_LEAST', 'attack', 1, 'AT_MOST', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: {
							deck: {
								deckstring: deckstring16minions,
								deck: decode(deckstring16minions),
							},
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});
				test('not completed with less cards meeting the requirement', () => {
					const deckstring14minions =
						'AAECAZICBOUHyZwDwIYDrtICDbMB8gHOlAOYDfUF7IwDqaID1YMDi+4Cz5QDnvkC7aID2QQA';
					const req = new DeckbuildingCardAttributeReq(15, 'AT_LEAST', 'attack', 1, 'AT_MOST', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: {
							deck: {
								deckstring: deckstring14minions,
								deck: decode(deckstring14minions),
							},
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
				test('not completed with correct number of cards but they do not meet the req', () => {
					const deckstring15highAttackMinions =
						'AAECAZICBOUHyZwDwIYDrtICDbMB8gHOlAOYDeyMA6f3AqmiA9WDA4vuAs+UA575Au2iA9kEAA==';
					const req = new DeckbuildingCardAttributeReq(15, 'AT_LEAST', 'attack', 1, 'AT_MOST', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: {
							deck: {
								deckstring: deckstring15highAttackMinions,
								deck: decode(deckstring15highAttackMinions),
							},
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});

				test('is not completed when deckstring is empty', () => {
					const req = new DeckbuildingCardAttributeReq(15, 'AT_LEAST', 'attack', 1, 'AT_MOST', cards);
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.LOCAL_PLAYER,
						localPlayer: {
							deck: {
								deckstring: undefined,
							},
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
			});
		});
	});

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_CARD_ATTRIBUTE_VALUE',
			'values': ['1', 'AT_MOST', 'attack', '1', 'AT_LEAST'],
		};

		const req = DeckbuildingCardAttributeReq.create(rawReq, cards);

		expect(req['targetNumberOfCards']).toBe(1);
		expect(req['qualifier']).toBe('AT_MOST');
		expect(req['targetAttribute']).toBe('attack');
		expect(req['targetAttributeValue']).toBe(1);
		expect(req['attributeQualifier']).toBe('AT_LEAST');
	});
});
