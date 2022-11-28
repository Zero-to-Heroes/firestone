import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameTieReq } from './game-tie-req';

describe('game-tie-req', () => {
	test('is completed when game result is a tie', () => {
		const req = new GameTieReq();
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.TIE,
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when winner event is processed', () => {
		const req = new GameTieReq();
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.WINNER,
			localPlayer: { PlayerId: 2 },
			additionalData: { winner: 2 },
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct cardId', () => {
		const rawReq: RawRequirement = {
			'type': 'GAME_TIE',
		};

		const req = GameTieReq.create(rawReq);

		expect(req).not.toBeNull();
	});
});
