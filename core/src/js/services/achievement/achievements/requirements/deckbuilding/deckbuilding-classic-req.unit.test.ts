import { decode } from 'deckstrings';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingClassicReq } from './deckbuilding-classic-req';

describe('deckbuilding-classic-req', () => {
	const deckstring = 'AAECAf0EApUDuAgOTXHDAbsC7gKLA6sEtATmBJYF7AXsB78IyQ0A';
	const cards = buildTestCardsService();

	test('is completed when deckstring contains only classic and basic cards', () => {
		const req = new DeckbuildingClassicReq(cards);
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
		const req = new DeckbuildingClassicReq(cards);
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
		const req = new DeckbuildingClassicReq(cards);
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
