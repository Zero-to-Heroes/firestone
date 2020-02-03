import { achievementsValidation } from '../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';
import rawAchievement1 from './raw_achievement_1.json';

describe('Battlegrounds - Leaderboard finish', () => {
	test('is completed when full events created by CSharp plugin', async () => {
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents);
		expect(isAchievementComplete).toBe(true);
	}, 20000);
	test('is not completed when rank is too poor', async () => {
		const isAchievementComplete = await achievementsValidation([rawAchievement1], pluginEvents);
		expect(isAchievementComplete).toBeFalsy();
	}, 20000);
});
