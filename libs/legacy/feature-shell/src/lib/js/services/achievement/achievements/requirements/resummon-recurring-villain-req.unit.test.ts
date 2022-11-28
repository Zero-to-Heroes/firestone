import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { ResummonRecurringVillainRew } from './resummon-recurring-villain-req';

describe('resummon-recurring-villain-req', () => {
	describe('qualifier is AT_LEAST', () => {
		test('is completed when recurring villain is resummoned exactly the target number of times ', () => {
			const req = new ResummonRecurringVillainRew(2, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.CARD_PLAYED,
				cardId: 'DAL_749',
				controllerId: 2,
				localPlayer: { PlayerId: 2 },
			} as GameEvent);
			const resummonEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MINION_SUMMONED,
				cardId: 'DAL_749',
				controllerId: 2,
				localPlayer: { PlayerId: 2 },
				additionalData: { creatorCardId: 'DAL_749' },
			} as GameEvent);

			req.test(event);
			req.test(resummonEvent);
			req.test(resummonEvent);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when recurring villain is resummoned more than the target number of times ', () => {
			const req = new ResummonRecurringVillainRew(2, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.CARD_PLAYED,
				cardId: 'DAL_749',
				controllerId: 2,
				localPlayer: { PlayerId: 2 },
			} as GameEvent);
			const resummonEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MINION_SUMMONED,
				cardId: 'DAL_749',
				controllerId: 2,
				localPlayer: { PlayerId: 2 },
				additionalData: { creatorCardId: 'DAL_749' },
			} as GameEvent);

			req.test(event);
			req.test(resummonEvent);
			req.test(resummonEvent);
			req.test(resummonEvent);

			expect(req.isCompleted()).toBe(true);
		});

		test('is not completed when recurring villain is resummoned less than the target number of times ', () => {
			const req = new ResummonRecurringVillainRew(2, 'AT_LEAST');
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.CARD_PLAYED,
				cardId: 'DAL_749',
				controllerId: 2,
				localPlayer: { PlayerId: 2 },
			} as GameEvent);
			const resummonEvent = Object.assign(new GameEvent(), {
				type: GameEvent.MINION_SUMMONED,
				cardId: 'DAL_749',
				controllerId: 2,
				localPlayer: { PlayerId: 2 },
				additionalData: { creatorCardId: 'DAL_749' },
			} as GameEvent);

			req.test(event);
			req.test(resummonEvent);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('req is intantiated with the correct target health', () => {
		const rawReq: RawRequirement = {
			'type': 'RESUMMONED_RECURRING_VILLAIN',
			'values': ['3', 'AT_LEAST'],
		};

		const req = ResummonRecurringVillainRew.create(rawReq);

		expect(req['targetNumberOfResummons']).toBe(3);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
