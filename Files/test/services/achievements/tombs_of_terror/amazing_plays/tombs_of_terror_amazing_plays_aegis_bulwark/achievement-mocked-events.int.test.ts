import { achievementsValidation } from '../../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Tombs of Terror - Amazing Play - Bulwark of Death', () => {
	test('is completed when full events created by CSharp plugin', async () => {
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents);
		expect(isAchievementComplete).toBe(true);
	});
});
