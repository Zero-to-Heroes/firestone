import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { TotalDiscardedCardsReq } from './total-discarded-cards-req';

describe('total-discarded-cards-req', () => {
	test('is completed when total discarded cards are equal to target total discarded cards', () => {
		const req = new TotalDiscardedCardsReq(2);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DISCARD_CARD,
			localPlayer: { PlayerId: 2 },
			controllerId: 2,
		} as GameEvent);

		req.test(event);
		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is completed when expecting 0 discarded cards and no card is discarded', () => {
		const req = new TotalDiscardedCardsReq(0);
		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when total discarded cards are not equal to target total discarded cards', () => {
		const req = new TotalDiscardedCardsReq(4);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.DISCARD_CARD,
			localPlayer: { PlayerId: 2 },
			controllerId: 2,
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target discarded cards', () => {
		const rawReq: RawRequirement = {
			'type': 'TOTAL_DISCARD',
			'values': ['1'],
		};

		const req = TotalDiscardedCardsReq.create(rawReq);

		expect(req['targetDiscardedCards']).toBe(1);
	});
});
