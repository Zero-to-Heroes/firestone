import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingTextNumberOfWordsReq } from './deckbuilding-text-number-of-words-req';

describe('deckbuilding-text-number-of-words-req', () => {
	const cards = buildTestCardsService();

	describe('qualifier is AT_LEAST', () => {
		describe('wordsQualifier is AT_LEAST', () => {
			test('is completed when deck contains exactly the number of cards that include exactly the expected number of words', () => {
				const deckstring3cardsWith3Words = 'AAEBAZICAtgBlboCDrds4soCswGL5QK2swK/AcSYA/AP2Qr+rgKiFPUM3A/S0wIA';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring3cardsWith3Words,
							deck: decode(deckstring3cardsWith3Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deck contains more than the number of cards that include exactly the expected number of words', () => {
				const deckstring4cardsWith3Words = 'AAEBAZICAA+3bOLKArMBi+UCtrMCvwHEmAPwD9kK/q4CohT1DNwP0tMClboCAA==';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring4cardsWith3Words,
							deck: decode(deckstring4cardsWith3Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deck contains exactly the number of cards that include more than the expected number of words', () => {
				const deckstring3cardsWith4Words = 'AAEBAZICAtuwAsUODrds4soCswGL5QK2swK/AcSYA/AP2Qr+rgKiFPUM3A/J7AIA';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring3cardsWith4Words,
							deck: decode(deckstring3cardsWith4Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deck contains more than the number of cards that include more than the expected number of words', () => {
				const deckstring4cardsWith4Words = 'AAEBAZICAA+3bOLKArMBi+UCtrMCvwHEmAPwD9kK/q4CohT1DNwPxQ7J7AIA';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring4cardsWith4Words,
							deck: decode(deckstring4cardsWith4Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when deck contains less than the number of cards that include at least the expected number of words', () => {
				const deckstring2cardsWith4Words = 'AAEBAZICAA+3bOLKArMBi+UCtrMCvwHEmAPwD9kK/q4CohT1DNwP27ACyewCAA==';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring2cardsWith4Words,
							deck: decode(deckstring2cardsWith4Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when deck contains more than the number of cards that include less than the expected number of words', () => {
				const deckstring4cardsWith2Words = 'AAEBAZICAA+3bOLKArMB9QWL5QK2swK/AcSYA/AP2Qr+rgKiFPUMggXcDwA=';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_LEAST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring4cardsWith2Words,
							deck: decode(deckstring4cardsWith2Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when deckstring is empty', () => {
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_LEAST', cards);
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

			test('sanity wioth another deckstring', () => {
				const deckstring = 'AAECAf0EBu4CyQOmhwOWmgOKngPYoAMMwwGxCKP9AoOWA6aYA5+bA6CbA+KbA4ukA76kA9alA/SrAwA=';
				const req = new DeckbuildingTextNumberOfWordsReq(30, 'AT_LEAST', 8, 'AT_LEAST', cards);
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
		});
		describe('wordsQualifier is AT_MOST', () => {
			test('is completed when deck contains exactly the number of cards that include exactly the expected number of words', () => {
				const deckstring3cardsWith3Words =
					'AAEBAZICBLdszpQDyZwDkdACDbazAsSrApiGA7AQqaID3hXVgwPfFZvNAsCGA6TCAoSwAtS7AgA=';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring3cardsWith3Words,
							deck: decode(deckstring3cardsWith3Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deck contains more than the number of cards that include exactly the expected number of words', () => {
				const deckstring4cardsWith3Words =
					'AAEBAZICBrdsswHOlAPEqwLJnAOR0AIMtrMCmIYDsBCpogPeFdWDA98Vm80CwIYDpMIChLAC1LsCAA==';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring4cardsWith3Words,
							deck: decode(deckstring4cardsWith3Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deck contains exactly the number of cards that include less than the expected number of words', () => {
				const deckstring3cardsWith2Words =
					'AAEBAZICBrdszpQDxKsCyqsDyZwDkdACDPUFmIYDsBCpogPeFdWDA98Vm80CwIYDpMIChLAC1LsCAA==';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring3cardsWith2Words,
							deck: decode(deckstring3cardsWith2Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deck contains more than the number of cards that include less than the expected number of words', () => {
				const deckstring4cardsWith2Words =
					'AAEBAZICCLdszpQDxKsCyqsD4gaYhgPJnAOR0AIL9QWwEKmiA94V1YMD3xWbzQLAhgOkwgKEsALUuwIA';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring4cardsWith2Words,
							deck: decode(deckstring4cardsWith2Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when deck contains less than the number of cards that include at most the expected number of words', () => {
				const deckstring2cardsWith2Words =
					'AAEBAZICBM6UA8usAsmcA5HQAg31BcSrApiGA7AQqaID3hXVgwPfFZvNAsCGA6TCAoSwAtS7AgA=';
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_MOST', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.PLAYERS_INFO,
					localPlayer: {
						deck: {
							deckstring: deckstring2cardsWith2Words,
							deck: decode(deckstring2cardsWith2Words),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when deckstring is empty', () => {
				const req = new DeckbuildingTextNumberOfWordsReq(3, 'AT_LEAST', 3, 'AT_MOST', cards);
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
		});
	});

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_TYPE',
			'values': ['1', 'AT_LEAST', '3', 'AT_MOST'],
		};

		const req = DeckbuildingTextNumberOfWordsReq.create(rawReq, cards);

		expect(req['targetCardQuantity']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['targetNumberOfWords']).toBe(3);
		expect(req['numberOfWordsQualifier']).toBe('AT_MOST');
	});
});
