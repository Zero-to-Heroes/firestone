import { RarityTYpe } from '@firestone-hs/reference-data';
import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingRarityReq } from './deckbuilding-rarity-req';

describe('deckbuilding-rarity-req', () => {
	const cards = buildTestCardsService();

	describe('rarity is epic', () => {
		describe('qualifier is AT_LEAST', () => {
			test('is completed when deckstring contains exactly the amount of epic cards', () => {
				const fullEpicDeckstring =
					'AAECAZ8FBsD9AvWAA+OGA+aGA9+gA8WhAwyKAbsD0gTzBZYJp/cC/PwC3f4C+v4CsZQDhpwDk6gDAA==';
				const req = new DeckbuildingRarityReq(30, 'AT_LEAST', 'epic' as RarityTYpe, cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: fullEpicDeckstring,
							deck: decode(fullEpicDeckstring),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deckstring contains more than the amount of epic cards', () => {
				const fullEpicDeckstring =
					'AAECAZ8FBsD9AvWAA+OGA+aGA9+gA8WhAwyKAbsD0gTzBZYJp/cC/PwC3f4C+v4CsZQDhpwDk6gDAA==';
				const req = new DeckbuildingRarityReq(29, 'AT_LEAST', 'epic' as RarityTYpe, cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: fullEpicDeckstring,
							deck: decode(fullEpicDeckstring),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when deckstring has less than the amount of epic cards', () => {
				const notFullyEpic = 'AAECAf0GAo+CA5eXAw4w0wHyAfUF2QexCMII9v0C+v4C3IYDxIkD7IwDiJ0DtZ8DAA==';
				const req = new DeckbuildingRarityReq(30, 'AT_LEAST', 'epic' as RarityTYpe, cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: notFullyEpic,
							deck: decode(notFullyEpic),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});
		describe('qualifier is AT_MOST', () => {
			test('is completed when deckstring contains exactly the amount of epic cards', () => {
				const deckstring10epic = 'AAECAf0EAA/IhwPNiQOfmwO5/wKmmAP0qwPO7wKfmAOJlgPimwOVA7T8As31Au4CtogDAA==';
				const req = new DeckbuildingRarityReq(10, 'AT_MOST', 'epic' as RarityTYpe, cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring10epic,
							deck: decode(deckstring10epic),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deckstring contains less than the amount of epic cards', () => {
				const deckstring9epic = 'AAECAf0EAp+YA+YEDsiHA82JA5+bA7n/AqaYA/SrA87vAomWA+KbA5UDtPwCzfUC7gK2iAMA';
				const req = new DeckbuildingRarityReq(10, 'AT_MOST', 'epic' as RarityTYpe, cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring9epic,
							deck: decode(deckstring9epic),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when deckstring contains more than the amount of epic cards', () => {
				const deckstring11epic =
					'AAECAf0EBrn/AqaYA5+YA+YEi6QDwqEDDMiHA82JA5+bA/SrA87vAomWA+KbA5UDtPwCzfUC7gK2iAMA';
				const req = new DeckbuildingRarityReq(10, 'AT_MOST', 'epic' as RarityTYpe, cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring11epic,
							deck: decode(deckstring11epic),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});
		test('is not completed when deckstring is empty', () => {
			const req = new DeckbuildingRarityReq(30, 'AT_LEAST', 'Epic', cards);
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
		test('sanity deckstring', () => {
			const deckstring = 'AAECAf0ECnGKAZ4C7gLJA+wFo/0C9YkD4psDi6QDCp4B5gTtBKCbA/+dA8KhA76kA7+kA92pA/SrAwA=';

			const reqC = new DeckbuildingRarityReq(10, 'AT_LEAST', 'common' as RarityTYpe, cards);
			const eventC = Object.assign(new GameEvent(), {
				type: GameEvent.PLAYERS_INFO,
				localPlayer: {
					deck: {
						deckstring: deckstring,
						deck: decode(deckstring),
					},
				},
			} as GameEvent);

			reqC.test(eventC);

			expect(reqC.isCompleted()).toBe(true);

			const reqR = new DeckbuildingRarityReq(10, 'AT_LEAST', 'rare' as RarityTYpe, cards);
			const eventR = Object.assign(new GameEvent(), {
				type: GameEvent.PLAYERS_INFO,
				localPlayer: {
					deck: {
						deckstring: deckstring,
						deck: decode(deckstring),
					},
				},
			} as GameEvent);

			reqR.test(eventR);

			expect(reqR.isCompleted()).toBe(true);

			const reqE = new DeckbuildingRarityReq(10, 'AT_LEAST', 'epic' as RarityTYpe, cards);
			const eventE = Object.assign(new GameEvent(), {
				type: GameEvent.PLAYERS_INFO,
				localPlayer: {
					deck: {
						deckstring: deckstring,
						deck: decode(deckstring),
					},
				},
			} as GameEvent);

			reqE.test(eventE);

			expect(reqE.isCompleted()).toBe(true);
		});
	});

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_RARITY',
			'values': ['1', 'AT_MOST', 'epic'],
		};

		const req = DeckbuildingRarityReq.create(rawReq, cards);

		expect(req['targetNumberOfCards']).toBe(1);
		expect(req['qualifier']).toBe('AT_MOST');
		expect(req['rarity']).toBe('epic');
	});
});
