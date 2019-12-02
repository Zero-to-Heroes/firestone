import { GameStat } from '../../../../../src/js/models/mainwindow/stats/game-stat';
import { GameStats } from '../../../../../src/js/models/mainwindow/stats/game-stats';
import { achievementsValidation } from '../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Competitive Ladder Win Streak', () => {
	const won = Object.assign(new GameStat(), {
		result: 'won',
		gameFormat: 'standard',
		gameMode: 'ranked',
	} as GameStat);
	const nakedWon = Object.assign(new GameStat(), {
		result: 'won',
	} as GameStat);
	const loss = Object.assign(new GameStat(), {
		result: 'lost',
		gameFormat: 'standard',
		gameMode: 'ranked',
	} as GameStat);

	test('is completed when full events created by CSharp plugin are emitted', async () => {
		// Provide the existing stats for the win streak - we only care about the result here
		const stats = [won, won, won];
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});

		expect(isAchievementComplete).toBe(true);
	});

	test('is not completed when previous win streak is not good enough', async () => {
		const stats = [won, loss, won];

		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});

		expect(isAchievementComplete).toBeFalsy();
	});

	test('is not completed when previous win streak is not in ranked standard', async () => {
		const stats = [nakedWon, nakedWon, nakedWon];

		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			gameStats: Object.assign(new GameStats(), {
				stats: stats,
			} as GameStats),
		});

		expect(isAchievementComplete).toBeFalsy();
	});
});
