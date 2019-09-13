import { decode } from 'deckstrings';
import cardsJson from '../../../../../../../dependencies/cards.json';
import { GameEvent } from '../../../../../models/game-event';
import { AllCardsService } from '../../../../all-cards.service';
import { DeckbuildingEpicReq } from './deckbuilding-epic-req';

describe('deckbuilding-epic-req', () => {
	const deckstring = 'AAECAZ8FBsD9AvWAA+OGA+aGA9+gA8WhAwyKAbsD0gTzBZYJp/cC/PwC3f4C+v4CsZQDhpwDk6gDAA==';
	const cards = buildCardsService();

	test('is completed when deckstring contains only epic cards', () => {
		const req = new DeckbuildingEpicReq(cards);
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
		const req = new DeckbuildingEpicReq(cards);
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
		const req = new DeckbuildingEpicReq(cards);
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

function buildCardsService() {
	const service = new AllCardsService(null, null);
	service['allCards'] = [...(cardsJson as any[])];
	return service;
}
