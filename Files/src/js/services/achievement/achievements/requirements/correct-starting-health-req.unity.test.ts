import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { CorrectStartingHealthReq } from './correct-starting-health-req';

describe('correct-starting-health-req', () => {
	test('is completed when minion has the expected starting health', () => {
		const req = new CorrectStartingHealthReq('ULDA_BOSS_39h', 300);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_ON_BOARD_AT_GAME_START,
			cardId: 'ULDA_BOSS_39h',
			additionalData: {
				health: 300,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBe(true);
	});
	test('is not completed when minion doesnt have the expected starting health', () => {
		const req = new CorrectStartingHealthReq('ULDA_BOSS_39h', 300);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_ON_BOARD_AT_GAME_START,
			cardId: 'ULDA_BOSS_39h',
			additionalData: {
				health: 215,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed when event is about another minion', () => {
		const req = new CorrectStartingHealthReq('ULDA_BOSS_38h', 300);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_ON_BOARD_AT_GAME_START,
			cardId: 'ULDA_BOSS_39h',
			additionalData: {
				health: 215,
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('is not completed when minion doesnt have a sepcified starting health', () => {
		const req = new CorrectStartingHealthReq('ULDA_BOSS_39h', 300);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.CARD_ON_BOARD_AT_GAME_START,
			cardId: 'ULDA_BOSS_39h',
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});
	test('req is intantiated with the correct format type', () => {
		const rawReq: RawRequirement = {
			'type': 'CORRECT_STARTING_HEALTH',
			'values': ['ULDA_BOSS_39h', '300'],
		};

		const req = CorrectStartingHealthReq.create(rawReq);

		expect(req['targetCardId']).toEqual('ULDA_BOSS_39h');
		expect(req['targetStartingHealth']).toEqual(300);
	});
});
