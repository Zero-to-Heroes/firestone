import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingCostReq } from './deckbuilding-cost-req';

describe('deckbuilding-cost-req', () => {
	const cards = buildTestCardsService();

	describe('qualifier is AT_LEAST', () => {
		describe('costQualifier is AT_LEAST', () => {
			test('is completed when deckstring contains exactly the amount of exact-cost cards', () => {
				const deckstring =
					'AAECAZICCNOUA/+ZA4OgA/ihA7WsA/mtA/utA4yuAwvNAf4B0wPhA5oIuZQDzpQD05wD3KID/60D3q8DAA==';
				const req = new DeckbuildingCostReq(8, 'AT_LEAST', 8, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
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
			test('is completed when deckstring contains exactly the amount of cards costing at least target', () => {
				const deckstring = 'AAECAZICCCTTlAP4oQO1rAP2rQP5rQP7rQOMrgMLzQH+AdMD4QOaCLmUA86UA9OcA9yiA/+tA96vAwA=';
				const req = new DeckbuildingCostReq(8, 'AT_LEAST', 8, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
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
			test('is completed when deckstring contains more than the amount of cards with exact cost', () => {
				const deckstring =
					'AAECAZICCNOUA/+ZA4OgA/ihA9yiA/mtA/utA4yuAwvNAf4B0wPhA5oIuZQDzpQD05wDtawD/60D3q8DAA==';
				const req = new DeckbuildingCostReq(8, 'AT_LEAST', 8, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
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
			test('is completed when deckstring contains more than the amount of cards costing at least target', () => {
				const deckstring =
					'AAECAZICCuEDxQTTlAP/mQODoAP4oQPcogP5rQP7rQOMrgMKzQH+AdMDmgi5lAPOlAPTnAO1rAP/rQPerwMA';
				const req = new DeckbuildingCostReq(8, 'AT_LEAST', 8, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
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
			test('is not completed when the deck does not contain enough costed cards', () => {
				const deckstring =
					'AAECAZICDNID4QPFBPMF+gyumwP4oQPcogO1rAP5rQP7rQOMrgMJ/gHTA5oIuZQDzpQD05wD/60D3q8D3b4DAA==';
				const req = new DeckbuildingCostReq(8, 'AT_LEAST', 8, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
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
			'type': 'DECK_CARD_COST',
			'values': ['10', 'AT_LEAST', '8', 'AT_LEAST'],
		};

		const req = DeckbuildingCostReq.create(rawReq, cards);

		expect(req['targetNumberOfCards']).toBe(10);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['targetCost']).toBe(8);
		expect(req['costQualifier']).toBe('AT_LEAST');
	});
});
