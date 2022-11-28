import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { CardDrawnOrReceivedInHandReq } from './card-drawn-or-received-in-hand-req';

describe('card-drawn-or-received-in-hand-req for CARD_DRAW_FROM_DECK event', () => {
	test('is completed when event has correct cardId and controllerId', () => {
		const cardId = 'AT_001';
		const req = new CardDrawnOrReceivedInHandReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_DRAW_FROM_DECK,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when event has incorrect cardId', () => {
		const cardId = 'AT_001';
		const req = new CardDrawnOrReceivedInHandReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_DRAW_FROM_DECK,
			cardId: cardId + 't',
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when event has CARD_DRAW_FROM_DECK with incorrect playerId', () => {
		const cardId = 'AT_001';
		const req = new CardDrawnOrReceivedInHandReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_DRAW_FROM_DECK,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
});
describe('card-drawn-or-received-in-hand-req for RECEIVE_CARD_IN_HAND event', () => {
	test('is completed when event has correct cardId and controllerId', () => {
		const cardId = 'AT_001';
		const req = new CardDrawnOrReceivedInHandReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.RECEIVE_CARD_IN_HAND,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});

	test('is not completed when event has incorrect cardId', () => {
		const cardId = 'AT_001';
		const req = new CardDrawnOrReceivedInHandReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.RECEIVE_CARD_IN_HAND,
			cardId: cardId + 't',
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is not completed when event has CARD_DRAW_FROM_DECK with incorrect playerId', () => {
		const cardId = 'AT_001';
		const req = new CardDrawnOrReceivedInHandReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.RECEIVE_CARD_IN_HAND,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
});

test('card-drawn-or-received-in-hand-req is not completed when event is not RECEIVE_CARD_IN_HAND nor CARD_DRAW_FROM_DECK', () => {
	const cardId = 'AT_001';
	const req = new CardDrawnOrReceivedInHandReq(cardId);
	const event = Object.assign(new GameEvent(), {
		type: GameEvent.CARD_CHANGED_ON_BOARD,
		cardId: cardId,
		controllerId: 1,
		localPlayer: { PlayerId: 1 },
	} as GameEvent);

	req.test(event);

	expect(req.isCompleted()).toBeFalsy();
});

test('card-drawn-or-received-in-hand-req isnt completed after reset', () => {
	const cardId = 'AT_001';
	const req = new CardDrawnOrReceivedInHandReq(cardId);
	const event = Object.assign(new GameEvent(), {
		type: GameEvent.RECEIVE_CARD_IN_HAND,
		cardId: cardId,
		controllerId: 1,
		localPlayer: { PlayerId: 1 },
	} as GameEvent);
	req.test(event);
	expect(req.isCompleted()).toBe(true);

	req.reset();

	expect(req.isCompleted()).toBeFalsy();
});

test('card-drawn-or-received-in-hand-req isnt completed after afterAchievementCompletionReset', () => {
	const cardId = 'AT_001';
	const req = new CardDrawnOrReceivedInHandReq(cardId);
	const event = Object.assign(new GameEvent(), {
		type: GameEvent.RECEIVE_CARD_IN_HAND,
		cardId: cardId,
		controllerId: 1,
		localPlayer: { PlayerId: 1 },
	} as GameEvent);
	req.test(event);
	expect(req.isCompleted()).toBe(true);

	req.afterAchievementCompletionReset();

	expect(req.isCompleted()).toBeFalsy();
});

test('card-drawn-or-received-in-hand-req is intantiated with the correct cardId', () => {
	const rawReq: RawRequirement = {
		'type': 'CARD_DRAWN_OR_RECEIVED_IN_HAND',
		'values': ['DALA_701'],
	};

	const req = CardDrawnOrReceivedInHandReq.create(rawReq);

	expect(req['cardId']).toBe('DALA_701');
});
