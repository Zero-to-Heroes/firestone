import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingNoCardWithLetterInNameReq } from './deckbuilding-no-card-with-letter-in-name-req';

describe('deckbuilding-no-card-with-letter-in-name-req', () => {
	const deckstring = 'AAECAZ8FAvoGxaEDDrMBowKzA7sD0gTlB6wI/vMC3fUCmfcChPwC2f4Ck6gDyqsDAA==';
	const cards = buildTestCardsService();

	test('is completed when deckstring has no card with letter in name', () => {
		const req = new DeckbuildingNoCardWithLetterInNameReq('e', cards);
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

	test('is not completed when deckstring is empty', () => {
		const req = new DeckbuildingNoCardWithLetterInNameReq('e', cards);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.PLAYERS_INFO,
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
		const req = new DeckbuildingNoCardWithLetterInNameReq('e', cards);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.PLAYERS_INFO,
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

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_NO_CARD_WITH_LETTER_IN_NAME',
			'values': ['e'],
		};

		const req = DeckbuildingNoCardWithLetterInNameReq.create(rawReq, cards);

		expect(req['letterToAvoid']).toBe('e');
	});
});
