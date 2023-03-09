/* eslint-disable @typescript-eslint/no-use-before-define */
import { GameStat } from '@firestone/stats/data-access';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameStats } from '../../../../models/mainwindow/stats/game-stats';
import { WinAgsinstClassInRankedStandardInLimitedTimeReq } from './win-against-class-in-ranked-standard-in-limited-time-req';

describe('win-against-class-in-ranked-standard-in-limited-time-req', () => {
	const won = Object.assign(new GameStat(), {
		result: 'won',
		gameFormat: 'standard',
		opponentClass: 'rogue',
		gameMode: 'ranked',
		creationTimestamp: new Date().getTime(),
	} as GameStat);
	const lost = Object.assign(new GameStat(), {
		result: 'lost',
		gameFormat: 'standard',
		opponentClass: 'rogue',
		gameMode: 'ranked',
		creationTimestamp: new Date().getTime(),
	} as GameStat);

	describe('qualifier is AT_LEAST', () => {
		test('is completed when wins are all against the class with exact number of wins in the correct timeframe', () => {
			const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.GAME_STATS_UPDATED,
				additionalData: {
					gameStats: Object.assign(new GameStats(), {
						stats: [addHours(won, -12), addHours(won, -11), addHours(won, 0)] as readonly GameStat[],
					} as GameStats),
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is completed when wins are all against the class with more than number of wins in the correct timeframe', () => {
			const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.GAME_STATS_UPDATED,
				additionalData: {
					gameStats: Object.assign(new GameStats(), {
						stats: [
							addHours(won, -12),
							addHours(won, -12),
							addHours(won, -10),
							addHours(won, -9),
						] as readonly GameStat[],
					} as GameStats),
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('is not completed when not enough wins', () => {
			const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.GAME_STATS_UPDATED,
				additionalData: {
					gameStats: Object.assign(new GameStats(), {
						stats: [addHours(won, -12), addHours(won, -12)] as readonly GameStat[],
					} as GameStats),
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});

		test('losses do not penialize', () => {
			const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.GAME_STATS_UPDATED,
				additionalData: {
					gameStats: Object.assign(new GameStats(), {
						stats: [
							addHours(won, -12),
							addHours(lost, -12),
							addHours(won, -10),
							addHours(won, -9),
						] as readonly GameStat[],
					} as GameStats),
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBe(true);
		});

		test('losses do not count towards completion', () => {
			const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.GAME_STATS_UPDATED,
				additionalData: {
					gameStats: Object.assign(new GameStats(), {
						stats: [addHours(won, -12), addHours(lost, -12), addHours(won, -10)] as readonly GameStat[],
					} as GameStats),
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});

		test('wins against another class do not count', () => {
			const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
			const winAgainstOtherClass = Object.assign(new GameStat(), won, {
				opponentClass: 'mage',
			} as GameStat);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.GAME_STATS_UPDATED,
				additionalData: {
					gameStats: Object.assign(new GameStats(), {
						stats: [
							addHours(won, -12),
							addHours(winAgainstOtherClass, -12),
							addHours(won, -10),
						] as readonly GameStat[],
					} as GameStats),
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});

		test('wins outside of the time window do not count', () => {
			const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
			const event = Object.assign(new GameEvent(), {
				type: GameEvent.GAME_STATS_UPDATED,
				additionalData: {
					gameStats: Object.assign(new GameStats(), {
						stats: [addHours(won, -15), addHours(won, -12), addHours(won, -10)] as readonly GameStat[],
					} as GameStats),
				},
			} as GameEvent);

			req.test(event);

			expect(req.isCompleted()).toBeFalsy();
		});
	});

	test('non-standard games are not taken into account', () => {
		const other = Object.assign(new GameStat(), won, {
			gameFormat: 'wild',
		} as GameStat);
		const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_STATS_UPDATED,
			additionalData: {
				gameStats: Object.assign(new GameStats(), {
					stats: [addHours(won, -11), addHours(other, -9), addHours(won, -8)] as readonly GameStat[],
				} as GameStats),
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('non-ranked games are not taken into account', () => {
		const other = Object.assign(new GameStat(), won, {
			gameMode: 'casual',
		} as GameStat);
		const req = new WinAgsinstClassInRankedStandardInLimitedTimeReq(3, 'AT_LEAST', 'rogue', 12);
		const event = Object.assign(new GameEvent(), {
			type: GameEvent.GAME_STATS_UPDATED,
			additionalData: {
				gameStats: Object.assign(new GameStats(), {
					stats: [addHours(won, -11), addHours(other, -9), addHours(won, -8)] as readonly GameStat[],
				} as GameStats),
			},
		} as GameEvent);

		req.test(event);

		expect(req.isCompleted()).toBeFalsy();
	});

	test('req is intantiated with the correct target info', () => {
		const rawReq: RawRequirement = {
			type: 'WINS_AGAINST_CLASS_IN_RANKED_STANDARD_IN_LIMITED_TIME',
			values: ['1', 'AT_LEAST', 'shaman', '8'],
		};

		const req = WinAgsinstClassInRankedStandardInLimitedTimeReq.create(rawReq);

		expect(req['targetVictories']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['opponentClass']).toBe('shaman');
		expect(req['periodOfTimeInHours']).toBe(8);
	});
});

const addHours = (stat: GameStat, hours: number): GameStat => {
	const timestamp = stat.creationTimestamp;
	const copy = new Date();
	copy.setTime(timestamp + hours * 60 * 60 * 1000);
	return Object.assign(new GameStat(), stat, {
		creationTimestamp: copy.getTime(),
	} as GameStat);
};
