import { Events } from '../../../../../../core/src/js/services/events.service';
import { achievementsValidation } from '../../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Tombs of Terror - Amazing Play - Unstoppable - Plague Lord of Wrath', () => {
	test('is not completed when both does ot start at full health', async () => {
		// Injecting the GEP events
		const additionalEvents = [
			{
				key: Events.SCENE_CHANGED,
				value: 'scene_gameplay',
			},
		];

		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, additionalEvents);
		expect(isAchievementComplete).toBeFalsy();
	});
});
