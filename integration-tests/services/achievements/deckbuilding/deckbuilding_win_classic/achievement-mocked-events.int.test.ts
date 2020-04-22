import { achievementsValidation } from '../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Deckbuilding - Classic', () => {
	test('is completed when full events created by CSharp plugin and GEP are emitted', async () => {
		const deckstring = 'AAECAf0EApUDuAgOTXHDAbsC7gKLA6sEtATmBJYF7AXsB78IyQ0A';
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			deckstring: deckstring,
			playerRank: {
				leagueId: 2,
				rank: 10,
			},
		});
		expect(isAchievementComplete).toBe(true);
	});

	test('is not completed when GEP event is missing', async () => {
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents);
		expect(isAchievementComplete).toBeFalsy();
	});

	test('is not completed when deckstring does not fullfill the condition', async () => {
		const deckstring = 'AAECAf0GAo+CA5eXAw4w0wHyAfUF2QexCMII9v0C+v4C3IYDxIkD7IwDiJ0DtZ8DAA==';
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			deckstring: deckstring,
			playerRank: {
				leagueId: 2,
				rank: 10,
			},
		});
		expect(isAchievementComplete).toBeFalsy();
	});

	test('is not completed when deckstring is empty', async () => {
		const deckstring = undefined;
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			deckstring: deckstring,
			playerRank: {
				leagueId: 2,
				rank: 10,
			},
		});
		expect(isAchievementComplete).toBeFalsy();
	});
});
