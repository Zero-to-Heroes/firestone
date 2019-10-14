import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { DeathrattleTriggeredReq } from './deathrattle-triggered-req';

describe('deathrattle-triggered-req', () => {
	test('is completed when event has right secret card id', () => {
		const req = new DeathrattleTriggeredReq('ULDA_114');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DEATHRATTLE_TRIGGERED,
			cardId: 'ULDA_114',
			controllerId: 2,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when event has incorrect secret card id', () => {
		const req = new DeathrattleTriggeredReq('ULDA_113');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DEATHRATTLE_TRIGGERED,
			cardId: 'ULDA_114',
			controllerId: 2,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed when controller is opponent', () => {
		const req = new DeathrattleTriggeredReq('ULDA_114');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DEATHRATTLE_TRIGGERED,
			cardId: 'ULDA_114',
			controllerId: 1,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('req is intantiated with the correct format type', () => {
		const rawReq: RawRequirement = {
			type: 'DEATHRATTLE_TRIGGERED',
			values: ['ULDA_114'],
			individualRestEvents: ['TURN_START'],
		};

		const req = DeathrattleTriggeredReq.create(rawReq);

		expect(req['targetCardId']).toEqual('ULDA_114');
		expect(req['individualResetEvents']).toEqual(['TURN_START']);
	});
});
