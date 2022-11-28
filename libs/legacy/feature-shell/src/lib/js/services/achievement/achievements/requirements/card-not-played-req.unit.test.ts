import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { CardNotPlayedReq } from './card-not-played-req';

describe('card-not-played-req', () => {
	test('is completed when the card has not been played', () => {
		const cardId = 'AT_001';
		const req = new CardNotPlayedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_PLAYED,
			cardId: 'AT_002',
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is completed when the card has been played by the other player', () => {
		const cardId = 'AT_001';
		const req = new CardNotPlayedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_PLAYED,
			cardId: cardId,
			controllerId: 2,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when the card has been played by the player', () => {
		const cardId = 'AT_001';
		const req = new CardNotPlayedReq(cardId);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_PLAYED,
			cardId: cardId,
			controllerId: 1,
			localPlayer: { PlayerId: 1 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
});

test('card-not-played-req is completed after reset', () => {
	const cardId = 'AT_001';
	const req = new CardNotPlayedReq(cardId);
	const event = Object.assign(new GameEvent(), {
		type: GameEvent.CARD_PLAYED,
		cardId: cardId,
		controllerId: 1,
		localPlayer: { PlayerId: 1 },
	} as GameEvent);
	req.test(event);
	expect(req.isCompleted()).toBeFalsy();

	req.reset();

	expect(req.isCompleted()).toBe(true);
});

test('card-not-played-req is intantiated with the correct info', () => {
	const rawReq: RawRequirement = {
		'type': 'CARD_NOT_PLAYED',
		'values': ['ULDA_111'],
	};

	const req = CardNotPlayedReq.create(rawReq);

	expect(req['cardId']).toBe('ULDA_111');
});
