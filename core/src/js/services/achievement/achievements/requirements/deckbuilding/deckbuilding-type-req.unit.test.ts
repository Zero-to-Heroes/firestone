import { AllCardsService } from '@firestone-hs/replay-parser';
import { decode } from 'deckstrings';
import cardsJson from '../../../../../../../test/cards.json';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { DeckbuildingTypeReq } from './deckbuilding-type-req';

describe('deckbuilding-type-req', () => {
	const cards = buildCardsService();

	describe('type is spell', () => {
		describe('qualifier is AT_MOST', () => {
			const noSpellDeckstring =
				'AAECAZICBMmcA67SAvX8ArQFDc6UA5iGA6miA9WDA8CGA4vuAs+UA575Au2iA9kE76IDt+4Cu58DAA==';

			test('is completed when deckstring contains less cards of specified type', () => {
				const req = new DeckbuildingTypeReq(0, 'SPELL', 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: noSpellDeckstring,
							deck: decode(noSpellDeckstring),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});

			test('is not completed when deckstring is empty', () => {
				const req = new DeckbuildingTypeReq(0, 'SPELL', 'AT_MOST', cards);
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
				const oneSpellDeckstring =
					'AAECAZICBNMDyZwD9fwCtAUNzpQDmIYDqaID1YMDwIYDi+4Cz5QDnvkC7aID2QTvogO37gK7nwMA';
				const req = new DeckbuildingTypeReq(0, 'SPELL', 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: oneSpellDeckstring,
							deck: decode(oneSpellDeckstring),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});
	});

	test('sanity deckstring', () => {
		const deckstring = 'AAECAf0ECE3DAbsC7gKrBOwHpocDuaUDC3G0BLwIo/0CppgDn5sDoJsD/50DwqEDv6QD9KsDAA==';
		const req = new DeckbuildingTypeReq(30, 'SPELL', 'AT_LEAST', cards);
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

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_TYPE',
			'values': ['1', 'SPELL', 'AT_LEAST'],
		};

		const req = DeckbuildingTypeReq.create(rawReq, cards);

		expect(req['targetTypeQuantity']).toBe(1);
		expect(req['type']).toBe('SPELL');
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});

function buildCardsService() {
	const service = new AllCardsService(null, null);
	service['allCards'] = [...(cardsJson as any[])];
	return service;
}
