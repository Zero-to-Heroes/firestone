/* eslint-disable @typescript-eslint/no-use-before-define */
import { GameStat } from '../../../../../core/src/js/models/mainwindow/stats/game-stat';
import { GameStats } from '../../../../../core/src/js/models/mainwindow/stats/game-stats';
import { achievementsValidation } from '../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Competitive Ladder Nemesis Rogue, 3, 12 hours', () => {
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

	test('is completed when win total is against a single class and has started soon enough', async () => {
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [addHours(won, -12), addHours(won, -11), addHours(won, -10)];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});
		expect(isAchievementComplete).toBe(true);
	});

	test('losses do not prevent completion', async () => {
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [addHours(won, -12), addHours(won, -11), addHours(lost, -10), addHours(won, -9)];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});
		expect(isAchievementComplete).toBe(true);
	});

	test('is not completed when win total is not high enough', async () => {
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [addHours(won, -12), addHours(won, -11)];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});
		expect(isAchievementComplete).toBeFalsy();
	});

	test('losses do not count towards completion', async () => {
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [addHours(won, -12), addHours(won, -11), addHours(lost, -11)];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});
		expect(isAchievementComplete).toBeFalsy();
	});

	test('is not completed when win total is high enough but first of the streak is too soon', async () => {
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [addHours(won, -13), addHours(won, -12), addHours(won, -11)];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});
		expect(isAchievementComplete).toBeFalsy();
	});

	test('is completed when win total is high enough even with a previous win that is too soon', async () => {
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [addHours(won, -13), addHours(won, -12), addHours(won, -11), addHours(won, -11)];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});
		expect(isAchievementComplete).toBe(true);
	});

	test('wins against other classes do not count', async () => {
		const winAgainstOther = Object.assign(new GameStat(), won, {
			opponentClass: 'shaman',
		} as GameStat);
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [addHours(won, -12), addHours(winAgainstOther, -11), addHours(won, -11)];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});
		expect(isAchievementComplete).toBeFalsy();
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
