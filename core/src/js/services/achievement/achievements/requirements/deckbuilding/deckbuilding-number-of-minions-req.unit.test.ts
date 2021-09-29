import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingNumberOfMinionsReq } from './deckbuilding-number-of-minions-req';

describe('deckbuilding-number-of-minions-req', () => {
	const cards = buildTestCardsService();

	describe('qualifier is AT_LEAST', () => {
		const deckstring = 'AAECAf0GAo+CA5eXAw4w0wHyAfUF2QexCMII9v0C+v4C3IYDxIkD7IwDiJ0DtZ8DAA==';

		test('is completed when deckstring contains at least target number of minions', () => {
			const req = new DeckbuildingNumberOfMinionsReq(27, 'AT_LEAST', cards);
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
			const req = new DeckbuildingNumberOfMinionsReq(27, 'AT_LEAST', cards);
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
			const req = new DeckbuildingNumberOfMinionsReq(28, 'AT_LEAST', cards);
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
	});

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_NUMBER_OF_MINIONS',
			'values': ['1', 'AT_LEAST'],
		};

		const req = DeckbuildingNumberOfMinionsReq.create(rawReq, cards);

		expect(req['targetNumberOfMinions']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
