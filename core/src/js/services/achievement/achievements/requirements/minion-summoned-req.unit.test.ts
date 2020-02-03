import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { MinionSummonedReq } from './minion-summoned-req';

describe('minion-summoned-req', () => {
	test('is completed when event has correct cardId and controllerId', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MINION_SUMMONED,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when event has incorrect cardId', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MINION_SUMMONED,
			cardId: cardId + 't',
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when event has incorrect playerId', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MINION_SUMMONED,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when event is CARD_PLAYED', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_PLAYED,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when event is CARD_CHANGED_ON_BOARD', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_CHANGED_ON_BOARD,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when event is CARD_ON_BOARD_AT_GAME_START', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_ON_BOARD_AT_GAME_START,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when event is RECRUIT_CARD', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.RECRUIT_CARD,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed after reset', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MINION_SUMMONED,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);
		req.test(event);
		expect(req.isCompleted()).toBe(true);

		req.reset();

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed after afterAchievementCompletionReset', () => {
		const cardId = 'ULD_705t';
		const req = new MinionSummonedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.MINION_SUMMONED,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);
		req.test(event);
		expect(req.isCompleted()).toBe(true);

		req.afterAchievementCompletionReset();

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is intantiated with the correct cardId', () => {
		const rawReq: RawRequirement = {
			'type': 'MINION_SUMMONED',
			'values': ['ULD_705t'],
		};

		const req = MinionSummonedReq.create(rawReq);

		expect(req['cardId']).toBe('ULD_705t');
	});
});
