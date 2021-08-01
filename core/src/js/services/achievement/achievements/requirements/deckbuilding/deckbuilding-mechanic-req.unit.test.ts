import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingMechanicReq } from './deckbuilding-mechanic-req';

describe('deckbuilding-mechanic-req', () => {
	const cards = buildTestCardsService();

	describe('mechanic is LIFESTEAL', () => {
		describe('qualifier is AT_LEAST', () => {
			const deckstring =
				'AAECAZ8FDowB+gb7/gKggAO9hgPshgP5kwOKmgOQmgO0mwOGnAODoAOYqAOWrAMIhuwC9uwCj+8C4O8CkPYC14kDoKEDoakDAA==';

			test('is completed when deckstring contains enough minions with target mechanic', () => {
				const req = new DeckbuildingMechanicReq(12, 'LIFESTEAL', 'AT_LEAST', cards);
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

			test('is not completed when deckstring is empty', () => {
				const req = new DeckbuildingMechanicReq(12, 'LIFESTEAL', 'AT_LEAST', cards);
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

			test('is not completed when deckstring does not fulfill the requirements', () => {
				const noClassic = 'AAECAf0GAo+CA5eXAw4w0wHyAfUF2QexCMII9v0C+v4C3IYDxIkD7IwDiJ0DtZ8DAA==';
				const req = new DeckbuildingMechanicReq(12, 'LIFESTEAL', 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: noClassic,
							deck: decode(noClassic),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});

		describe('qualifier is AT_MOST', () => {
			const deckstring = 'AAECAf0GAo+CA5eXAw4w0wHyAfUF2QexCMII9v0C+v4C3IYDxIkD7IwDiJ0DtZ8DAA==';

			test('is completed when deckstring contains less minions with target mechanic', () => {
				const req = new DeckbuildingMechanicReq(0, 'LIFESTEAL', 'AT_MOST', cards);
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

			test('is not completed when deckstring is empty', () => {
				const req = new DeckbuildingMechanicReq(0, 'LIFESTEAL', 'AT_MOST', cards);
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

			test('is not completed when deckstring does not fulfill the requirements', () => {
				const noClassic =
					'AAECAZ8FDowB+gb7/gKggAO9hgPshgP5kwOKmgOQmgO0mwOGnAODoAOYqAOWrAMIhuwC9uwCj+8C4O8CkPYC14kDoKEDoakDAA==';
				const req = new DeckbuildingMechanicReq(0, 'LIFESTEAL', 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: noClassic,
							deck: decode(noClassic),
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
			'type': 'DECK_LIFESTEAL',
			'values': ['1', 'LIFESTEAL', 'AT_LEAST'],
		};

		const req = DeckbuildingMechanicReq.create(rawReq, cards);

		expect(req['targetLifestealMinions']).toBe(1);
		expect(req['mechanic']).toBe('LIFESTEAL');
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
