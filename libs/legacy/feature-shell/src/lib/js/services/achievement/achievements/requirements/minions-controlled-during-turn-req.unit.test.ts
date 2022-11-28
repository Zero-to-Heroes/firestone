import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent, GameState } from '../../../../models/game-event';
import { MinionsControlledDuringTurnReq } from './minions-controlled-during-turn-req';

describe('minions-controlled-during-turn-req', () => {
	describe('qualifier is AT_LEAST', () => {
		test('is completed when any event has exactly the required minions on board', () => {
			const req = new MinionsControlledDuringTurnReq('ULD_703', 3, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: 'whatever-event-with-gameState',
				gameState: ({
					Player: {
						Board: [{ cardId: 'ULD_703' }, { cardId: 'ULD_703' }, { cardId: 'ULD_703' }],
					},
				} as unknown) as GameState,
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when any event has more than the required minions on board', () => {
			const req = new MinionsControlledDuringTurnReq('ULD_703', 1, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: 'whatever-event-with-gameState',
				gameState: ({
					Player: {
						Board: [{ cardId: 'ULD_703' }, { cardId: 'ULD_703' }, { cardId: 'ULD_703' }],
					},
				} as unknown) as GameState,
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is not completed when any event has less than the required minions on board', () => {
			const req = new MinionsControlledDuringTurnReq('ULD_703', 3, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: 'whatever-event-with-gameState',
				gameState: ({
					Player: {
						Board: [{ cardId: 'ULD_703' }],
					},
				} as unknown) as GameState,
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});

		test('is not completed when any event without gameState', () => {
			const req = new MinionsControlledDuringTurnReq('ULD_703', 3, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: 'whatever-event-without-gameState',
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			'type': 'MINIONS_CONTROLLED_DURING_TURN',
			'values': ['ULD_703', '1', 'AT_LEAST'],
		};

		const req = MinionsControlledDuringTurnReq.create(rawReq);

		expect(req['minionCardId']).toBe('ULD_703');
		expect(req['targetNumberOfMinions']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
