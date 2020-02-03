import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { BattlegroundsFinishReq } from './battlegrounds-finish-req';

describe('battlegrounds-finish-req', () => {
	test('is completed when game is finished and player leaderboard position is exactly the target', () => {
		const req = new BattlegroundsFinishReq(4, 'AT_LEAST');
		const leaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 4,
			},
		} as GameEvent);
		const gameEndEvent = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
		} as GameEvent);

		req.test(leaderboardEvent);
		req.test(gameEndEvent);

		expect(req.isCompleted()).toBe(true);
	});
	test('is completed when game is finished and player leaderboard position is lower than the target', () => {
		const req = new BattlegroundsFinishReq(4, 'AT_LEAST');
		const leaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 1,
			},
		} as GameEvent);
		const gameEndEvent = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
		} as GameEvent);

		req.test(leaderboardEvent);
		req.test(gameEndEvent);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when game is finished and player leaderboard position is greater than the target', () => {
		const req = new BattlegroundsFinishReq(4, 'AT_LEAST');
		const leaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 5,
			},
		} as GameEvent);
		const gameEndEvent = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
		} as GameEvent);

		req.test(leaderboardEvent);
		req.test(gameEndEvent);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed when game is finished and player leaderboard position is greater than the target, even though it was lower at some point', () => {
		const req = new BattlegroundsFinishReq(4, 'AT_LEAST');
		const preLeaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 1,
			},
		} as GameEvent);
		const leaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 5,
			},
		} as GameEvent);
		const gameEndEvent = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
		} as GameEvent);

		req.test(preLeaderboardEvent);
		req.test(leaderboardEvent);
		req.test(gameEndEvent);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is completed when game is finished and player leaderboard position is lower than the target, even though it was greater at some point', () => {
		const req = new BattlegroundsFinishReq(4, 'AT_LEAST');
		const preLeaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 1,
			},
		} as GameEvent);
		const leaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 5,
			},
		} as GameEvent);
		const gameEndEvent = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_END,
		} as GameEvent);

		req.test(leaderboardEvent);
		req.test(preLeaderboardEvent);
		req.test(gameEndEvent);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when game is not finished', () => {
		const req = new BattlegroundsFinishReq(4, 'AT_LEAST');
		const leaderboardEvent = Object.assign(new GameEvent(), {
			type: GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED,
			additionalData: {
				newPlace: 5,
			},
		} as GameEvent);

		req.test(leaderboardEvent);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('is intantiated with the correct cardId', () => {
		const rawReq: RawRequirement = {
			'type': 'BATTLEGROUNDS_FINISH',
			'values': ['4', 'AT_LEAST'],
		};

		const req = BattlegroundsFinishReq.create(rawReq);

		expect(req['targetPlace']).toBe(4);
		expect(req['qualifier']).toBe('AT_LEAST');
	});
});
