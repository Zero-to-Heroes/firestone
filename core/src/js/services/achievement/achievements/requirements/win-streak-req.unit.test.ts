import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../../models/mainwindow/stats/game-stats';
import { WinStreakReq } from './win-streak-req';

describe('win-streak-req', () => {
	describe('format is standard', () => {
		describe('mode is ranked', () => {
			const wonStat = Object.assign(new GameStat(), {
				result: 'won',
				gameFormat: 'standard',
				gameMode: 'ranked',
			} as GameStat);
			const lostStat = Object.assign(new GameStat(), {
				result: 'lost',
				gameFormat: 'standard',
				gameMode: 'ranked',
			} as GameStat);

			describe('qualifier is AT_LEAST', () => {
				test('is completed when win streaks contains exactly the correct amount of wins', () => {
					const req = new WinStreakReq(3, 'AT_LEAST', 'standard', 'ranked');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.GAME_STATS_UPDATED,
						additionalData: {
							gameStats: Object.assign(new GameStats(), {
								stats: [wonStat, wonStat, wonStat] as readonly GameStat[],
							} as GameStats),
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});

				test('is completed when win streaks contains more than the correct amount of wins', () => {
					const req = new WinStreakReq(3, 'AT_LEAST', 'standard', 'ranked');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.GAME_STATS_UPDATED,
						additionalData: {
							gameStats: Object.assign(new GameStats(), {
								stats: [wonStat, wonStat, wonStat, wonStat] as readonly GameStat[],
							} as GameStats),
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBe(true);
				});

				test('is not completed when win streaks contains less than the correct amount of wins', () => {
					const req = new WinStreakReq(3, 'AT_LEAST', 'standard', 'ranked');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.GAME_STATS_UPDATED,
						additionalData: {
							gameStats: Object.assign(new GameStats(), {
								stats: [wonStat, wonStat] as readonly GameStat[],
							} as GameStats),
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});

				test('is not completed when required wins are not consecutive', () => {
					const req = new WinStreakReq(3, 'AT_LEAST', 'standard', 'ranked');
					const event = Object.assign(new GameEvent(), {
						type: GameEvent.GAME_STATS_UPDATED,
						additionalData: {
							gameStats: Object.assign(new GameStats(), {
								stats: [wonStat, wonStat, lostStat, wonStat] as readonly GameStat[],
							} as GameStats),
						},
					} as GameEvent);

					req.test(event);

					expect(req.isCompleted()).toBeFalsy();
				});
			});

			test('non-standard games are not taken into account', () => {
				const rankedWild = Object.assign(new GameStat(), {
					result: 'won',
					gameMode: 'ranked',
					gameFormat: 'wild',
				} as GameStat);
				const req = new WinStreakReq(3, 'AT_LEAST', 'standard', 'ranked');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.GAME_STATS_UPDATED,
					additionalData: {
						gameStats: Object.assign(new GameStats(), {
							stats: [rankedWild, rankedWild, rankedWild, wonStat, wonStat] as readonly GameStat[],
						} as GameStats),
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});

			test('non-ranked games are not taken into account', () => {
				const casualStandard = Object.assign(new GameStat(), {
					result: 'won',
					gameFormat: 'standard',
					gameMode: 'casual',
				} as GameStat);
				const req = new WinStreakReq(3, 'AT_LEAST', 'standard', 'ranked');
				const event = Object.assign(new GameEvent(), {
					type: GameEvent.GAME_STATS_UPDATED,
					additionalData: {
						gameStats: Object.assign(new GameStats(), {
							stats: [
								casualStandard,
								casualStandard,
								casualStandard,
								wonStat,
								wonStat,
							] as readonly GameStat[],
						} as GameStats),
					},
				} as GameEvent);

				req.test(event);

				expect(req.isCompleted()).toBeFalsy();
			});
		});
	});

	test('req is intantiated with the correct target win streak and qualifier', () => {
		const rawReq: RawRequirement = {
			'type': 'WIN_STREAK_LENGTH',
			'values': ['1', 'AT_LEAST', 'standard', 'ranked'],
		};

		const req = WinStreakReq.create(rawReq);

		expect(req['targetWinStreak']).toBe(1);
		expect(req['qualifier']).toBe('AT_LEAST');
		expect(req['gameFormat']).toBe('standard');
		expect(req['gameMode']).toBe('ranked');
	});
});
