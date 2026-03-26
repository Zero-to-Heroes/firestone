import { GameEvent } from '@firestone/game-state';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { MinionsControlledDuringTurnReq } from './minions-controlled-during-turn-req';

describe('minions-controlled-during-turn-req', () => {
	describe('qualifier is AT_LEAST', () => {
		test('is not completed when board minion count is not available on the event', () => {
			const req = new MinionsControlledDuringTurnReq('ULD_703', 3, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: 'whatever-event',
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('req is intantiated with the correct info', () => {
		const rawReq: RawRequirement = {
			type: 'MINIONS_CONTROLLED_DURING_TURN',
			values: ['ULD_703', '1', 'AT_LEAST'],
		};

		const req = MinionsControlledDuringTurnReq.create(rawReq);

		expect(req['minionCardId']).toBe('ULD_703');
		expect(req['targetNumberOfMinions']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
