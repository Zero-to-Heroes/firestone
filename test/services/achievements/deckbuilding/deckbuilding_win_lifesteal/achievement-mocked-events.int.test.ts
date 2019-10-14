import { Events } from '../../../../../src/js/services/events.service';
import { achievementsValidation } from '../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Deckbuilding - Lifesteal', () => {
	test('is completed when full events created by CSharp plugin and GEP are emitted', async () => {
		// Injecting the GEP events
		const additionalEvents = [
			{
				key: Events.PLAYER_INFO,
				value: { standardRank: 10 },
			},
		];
		const deckstring = 'AAECAZ8FDowB+gb7/gKggAO9hgPshgP5kwOKmgOQmgO0mwOGnAODoAOYqAOWrAMIhuwC9uwCj+8C4O8CkPYC14kDoKEDoakDAA==';
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, additionalEvents, {
			deckstring: deckstring,
		});
		expect(isAchievementComplete).toBe(true);
	});

	test('is not completed when GEP event is missing', async () => {
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents);
		expect(isAchievementComplete).toBeFalsy();
	});

	test('is not completed when deckstring does not fullfill the condition', async () => {
		// Injecting the GEP events
		const additionalEvents = [
			{
				key: Events.PLAYER_INFO,
				value: { standardRank: 10 },
			},
		];
		const deckstring = 'AAECAf0GAo+CA5eXAw4w0wHyAfUF2QexCMII9v0C+v4C3IYDxIkD7IwDiJ0DtZ8DAA==';
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, additionalEvents, {
			deckstring: deckstring,
		});
		expect(isAchievementComplete).toBeFalsy();
	});

	test('is not completed when deckstring is empty', async () => {
		// Injecting the GEP events
		const additionalEvents = [
			{
				key: Events.PLAYER_INFO,
				value: { standardRank: 10 },
			},
		];
		const deckstring = undefined;
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, additionalEvents, {
			deckstring: deckstring,
		});
		expect(isAchievementComplete).toBeFalsy();
	});
});
