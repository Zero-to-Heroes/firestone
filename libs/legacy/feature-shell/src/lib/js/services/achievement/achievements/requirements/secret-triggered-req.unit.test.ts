import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { SecretTriggeredReq } from './secret-triggered-req';

describe('secret-triggered-req', () => {
	test('is completed when event has right secret card id', () => {
		const req = new SecretTriggeredReq('ULDA_045t');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.SECRET_TRIGGERED,
			cardId: 'ULDA_045t',
			controllerId: 2,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when event has incorrect secret card id', () => {
		const req = new SecretTriggeredReq('ULDA_045');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.SECRET_TRIGGERED,
			cardId: 'ULDA_045t',
			controllerId: 2,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed when controller is opponent', () => {
		const req = new SecretTriggeredReq('ULDA_045t');
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.SECRET_TRIGGERED,
			cardId: 'ULDA_045t',
			controllerId: 1,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('req is intantiated with the correct format type', () => {
		const rawReq: RawRequirement = {
			'type': 'SECRET_TRIGGER',
			'values': ['ULDA_045'],
			individualRestEvents: ['TURN_START'],
		};

		const req = SecretTriggeredReq.create(rawReq);

		expect(req['targetSecret']).toEqual('ULDA_045');
		expect(req['individualResetEvents']).toEqual(['TURN_START']);
	});
});
