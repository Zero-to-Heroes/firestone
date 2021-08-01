import { decode } from 'deckstrings';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement.js';
import { GameEvent } from '../../../../../models/game-event';
import { buildTestCardsService } from '../../../../test-utils';
import { DeckbuildingTextReq } from './deckbuilding-text-req';

describe('deckbuilding-text-req', () => {
	const cards = buildTestCardsService();

	describe('textQualifier is CONTAINS', () => {
		describe('qualifier is AT_LEAST', () => {
			test('is completed when deckstring contains exactly the number of cards that includes the target text in card text', () => {
				const deckstring1summonInText =
					'AAECAf0EBLwIuaUDzPQClgUNyIcDtATNiQP/nQOfmwO5/wKmmAP0qwO/A76kA+r2As7vAu+AAwA=';
				const req = new DeckbuildingTextReq(1, 'AT_LEAST', 'summon', 'CONTAINS', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring1summonInText,
							deck: decode(deckstring1summonInText),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deckstring contains exactly the number of cards that includes the target text in card name', () => {
				const deckstring1summonInName =
					'AAEBAf0EBpzTArmlA5+bA8z0ApYF1p0DDMiHA7QEzYkD/50Duf8CppgD9KsDvwO+pAPq9gLO7wLvgAMA';
				const req = new DeckbuildingTextReq(1, 'AT_LEAST', 'summon', 'CONTAINS', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring1summonInName,
							deck: decode(deckstring1summonInName),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deckstring contains more than the number of cards that includes the target text in card text', () => {
				const deckstring2summonInText =
					'AAEBAf0EBJzTArmlA5+bA8z0Ag3IhwO0BM2JA/+dA7wIuf8CppgD9KsDvwO+pAPq9gLO7wLvgAMA';
				const req = new DeckbuildingTextReq(1, 'AT_LEAST', 'summon', 'CONTAINS', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring2summonInText,
							deck: decode(deckstring2summonInText),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when deckstring contains more than the number of cards that includes the target text in card name', () => {
				const deckstring2summonInName =
					'AAECAf0EBLmlA5+bA8z0ApYFDciHA7QEzYkD/50Duf8CppgD9KsDvwO+pAPq9gLO7wLvgAPWnQMA';
				const req = new DeckbuildingTextReq(1, 'AT_LEAST', 'summon', 'CONTAINS', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring2summonInName,
							deck: decode(deckstring2summonInName),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is completed when text + name includes at least enough occurrences but each is less than required', () => {
				const deckstring2summonInNameAndText =
					'AAEBAf0EBpzTArwIuaUDn5sDzPQC1p0DDMiHA7QEzYkD/50Duf8CppgD9KsDvwO+pAPq9gLO7wLvgAMA';
				const req = new DeckbuildingTextReq(2, 'AT_LEAST', 'summon', 'CONTAINS', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring2summonInNameAndText,
							deck: decode(deckstring2summonInNameAndText),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBe(true);
			});
			test('is not completed when text + name does not include at least enough occurrences', () => {
				const deckstring2summonInNameAndText =
					'AAEBAf0EBpzTArwIuaUDn5sDzPQC1p0DDMiHA7QEzYkD/50Duf8CppgD9KsDvwO+pAPq9gLO7wLvgAMA';
				const req = new DeckbuildingTextReq(3, 'AT_LEAST', 'summon', 'CONTAINS', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstring2summonInNameAndText,
							deck: decode(deckstring2summonInNameAndText),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('is not completed when deckstring is empty', () => {
				const req = new DeckbuildingTextReq(2, 'AT_LEAST', 'summon', 'CONTAINS', cards);
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
			test('is not completed when card does not contain the full text', () => {
				const deckstringWithOneSummonKeyword =
					'AAEBAf0EBoS7ApzTArwIuaUDn5sDzPQCDMiHA7QEzYkD/50Duf8CppgD9KsDvwO+pAPq9gLO7wLvgAMA';
				const req = new DeckbuildingTextReq(1, 'AT_LEAST', 'summoner', 'CONTAINS', cards);
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.LOCAL_PLAYER,
					localPlayer: {
						deck: {
							deckstring: deckstringWithOneSummonKeyword,
							deck: decode(deckstringWithOneSummonKeyword),
						},
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
			test('sanity random deckstring', () => {
				const deckstring = 'AAECAf0EBt4Fw/gChvsCpocD1pkD2KADDLQE+gWxCPvsAsLzAqP9AomWA6aYA+KbA8KhA4ukA4ipAwA=';
				const req = new DeckbuildingTextReq(30, 'AT_LEAST', 'random', 'CONTAINS', cards);
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
		});
	});

	test('req is intantiated with the correct expected info', () => {
		const rawReq: RawRequirement = {
			'type': 'DECK_TYPE',
			'values': ['1', 'AT_LEAST', 'summon', 'CONTAINS'],
		};

		const req = DeckbuildingTextReq.create(rawReq, cards);

		expect(req['targetCardQuantity']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['text']).toBe('summon');
		expect(req['textQualifier']).toBe('CONTAINS');
	});
});
