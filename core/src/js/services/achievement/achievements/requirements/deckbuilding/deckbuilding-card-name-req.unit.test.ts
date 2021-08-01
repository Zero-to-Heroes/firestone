import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingCardNameReq } from './deckbuilding-card-name-req';

describe('deckbuilding-card-name', () => {
	const cards = buildTestCardsService();

	describe('textQualifier is STARTS_WITH', () => {
		describe('qualifier is AT_LEAST', () => {
			test('is completed when deckstring contains exactly the number of cards that includes the target text in card text', () => {
				const deckstring = 'AAECAaIHBPYEiJsD+6UD+8QDDe0CzQO9BMQFxgXdCK+RA5CXA/+lA76uA5u2A522A7m4AwA=';
				const req = new DeckbuildingCardNameReq(30, 'AT_LEAST', 'STARTS_WITH', 'T|H|I|J|S', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring,
							deck: decode(deckstring),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when deckstring contains exactly the number of cards that includes the target text in card text', () => {
				const deckstring = 'AAECAaIHBvYExAWImwPHmwP7pQP7xAMM7QLNA70ExgXdCK+RA5CXA/+lA76uA5u2A522A7m4AwA=';
				const req = new DeckbuildingCardNameReq(30, 'AT_LEAST', 'STARTS_WITH', 'T|H|I|J|S', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring,
							deck: decode(deckstring),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});
	});

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_CARD_NAME',
			'values': ['30', 'AT_LEAST', 'STARTS_WITH', 'T|H|I|J|S'],
		};

		const req = DeckbuildingCardNameReq.create(rawReq, cards);

		expect(req['targetCardQuantity']).toBe(30);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['textQualifier']).toBe('STARTS_WITH');
		expect(req['text']).toEqual(['T', 'H', 'I', 'J', 'S']);
	});
});
