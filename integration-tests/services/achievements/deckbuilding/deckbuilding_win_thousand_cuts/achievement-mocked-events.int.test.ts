import { achievementsValidation } from '../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Deckbuilding - Death by a Thousand Cuts', () => {
	test('is completed when full events created by CSharp plugin and GEP are emitted', async () => {
		const deckstring = 'AAECAZICAsmcA67SAg6zAfIBzpQDmA31Bf2nA6miA9WDA8CGA4vuAs+UA575Au2iA9kEAA==';
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			deckstring: deckstring,
			playerRank: {
				leagueId: 2,
				rank: 10,
			},
		});
		expect(isAchievementComplete).toBe(true);
	});

	test('is completed when full events created by CSharp plugin and GEP are emitted even with cards with 0 attack', async () => {
		const deckstring = 'AAECAaoIBsUDrwSn7gLv9wLiiQP9pwMMuwPbA/4D7/ECtJEDjJQDtZgDxpkD1KUD+aUDr6cDyqsDAA==';
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

	test('is not completed when deckstring has one spell', async () => {
		const deckstring = 'AAECAZICBP4BqaIDyZwDrtICDbMB8gHOlAOYDfUF/acD1YMDwIYDi+4Cz5QDnvkC7aID2QQA';
		const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents, null, {
			deckstring: deckstring,
			playerRank: {
				leagueId: 2,
				rank: 10,
			},
		});
		expect(isAchievementComplete).toBeFalsy();
	});

	test('is not completed when deckstring has not enough 1- attack minions', async () => {
		const deckstring = 'AAECAZICBqmiA8mcA67SAvX8Asv1AtmpAwzyAc6UA/UF/acD1YMDwIYDi+4Cz5QDnvkC7aID2QTvogMA';
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
