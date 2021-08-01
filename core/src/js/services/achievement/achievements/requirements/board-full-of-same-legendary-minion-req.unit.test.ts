import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent, GameState } from '../../../../models/game-event';
import { buildTestCardsService } from '../../../test-utils';
import { BoardFullOfSameLegendaryMinionReq } from './board-full-of-same-legendary-minion-req';

describe('board-full-of-same-legendary-minion-req', () => {
	const cards = buildTestCardsService();

	test('is completed when any event has a board full of 7 copies of the same leg minion', () => {
		const req = new BoardFullOfSameLegendaryMinionReq(cards);
		const event = Object.assign(new GameEvent(), {
			type: 'whatever-event-with-gameState',
			gameState: ({
				Player: {
					Board: [
						{ cardId: 'EX1_563' }, // Malygos
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
					],
				},
			} as unknown) as GameState,
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed not when any event has a board 7 leg minions, but two different ones', () => {
		const req = new BoardFullOfSameLegendaryMinionReq(cards);
		const event = Object.assign(new GameEvent(), {
			type: 'whatever-event-with-gameState',
			gameState: ({
				Player: {
					Board: [
						{ cardId: 'EX1_563' }, // Malygos
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_572' }, // Ysera
					],
				},
			} as unknown) as GameState,
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed not when any event has a board with less than 7 copies of the same leg minion', () => {
		const req = new BoardFullOfSameLegendaryMinionReq(cards);
		const event = Object.assign(new GameEvent(), {
			type: 'whatever-event-with-gameState',
			gameState: ({
				Player: {
					Board: [
						{ cardId: 'EX1_563' }, // Malygos
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
						{ cardId: 'EX1_563' },
					],
				},
			} as unknown) as GameState,
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed not when any event has a board full with 7 copies of the same non-leg minion', () => {
		const req = new BoardFullOfSameLegendaryMinionReq(cards);
		const event = Object.assign(new GameEvent(), {
			type: 'whatever-event-with-gameState',
			gameState: ({
				Player: {
					Board: [
						{ cardId: 'EX1_586' }, // Sea Giant
						{ cardId: 'EX1_586' },
						{ cardId: 'EX1_586' },
						{ cardId: 'EX1_586' },
						{ cardId: 'EX1_586' },
						{ cardId: 'EX1_586' },
						{ cardId: 'EX1_586' },
					],
				},
			} as unknown) as GameState,
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when any event without gameState', () => {
		const req = new BoardFullOfSameLegendaryMinionReq(cards);
		const event = Object.assign(new GameEvent(), {
			type: 'whatever-event-without-gameState',
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'BOARD_FULL_OF_SAME_LEGENDARY_MINION',
		};

		BoardFullOfSameLegendaryMinionReq.create(rawReq, cards);

		// Just check that no error or exception is raised
	});
});
