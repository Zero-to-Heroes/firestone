import { achievementsValidation } from '../../../achievement-event-validation';
// These are created by copy-paste of the csharp plugin output after 
// processing the power.log file
// Ideally, we will not have to go through this manual generation step
// and be able to plug the C# plugin directly
import pluginEvents from './plugin-events.json';
import rawAchievement from './raw_achievement.json';

describe('Rumble Run - Shrines - Dark Reliquary', () => {
	const cardPlayedEvent = {
		Type: 'CARD_ON_BOARD_AT_GAME_START',
		Value: {
			CardId: 'TRLA_178',
			ControllerId: 2,
			LocalPlayer: {
				PlayerId: 2,
			},
		},
	};
	const mulliganDoneEvent = {
		Type: 'MULLIGAN_DONE',
	};
	const matchMetadataEvent = {
		Type: 'MATCH_METADATA',
		Value: {
			ScenarioID: 2890,
		},
	};

	describe('in play', () => {
		test('is completed when all events are emitted', async () => {
			const isAchievementComplete = await achievementsValidation([rawAchievement], pluginEvents);
			expect(isAchievementComplete).toBe(true);
		});

		test('is completed when full events created by CSharp plugin are emitted', async () => {
			const minimalPluginEvents = [cardPlayedEvent, mulliganDoneEvent, matchMetadataEvent];
			const isAchievementComplete = await achievementsValidation([rawAchievement], minimalPluginEvents);
			expect(isAchievementComplete).toBe(true);
		});

		test('is not completed when it is not in play at the start', async () => {
			const minimalPluginEvents = [mulliganDoneEvent, matchMetadataEvent];
			const isAchievementComplete = await achievementsValidation([rawAchievement], minimalPluginEvents);
			expect(isAchievementComplete).toBe(false);
		});

		test('is not completed when mulligan is not done', async () => {
			const minimalPluginEvents = [cardPlayedEvent, matchMetadataEvent];
			const isAchievementComplete = await achievementsValidation([rawAchievement], minimalPluginEvents);
			expect(isAchievementComplete).toBe(false);
		});

		test('is not completed when we match metadata is absent', async () => {
			const minimalPluginEvents = [cardPlayedEvent, mulliganDoneEvent];
			const isAchievementComplete = await achievementsValidation([rawAchievement], minimalPluginEvents);
			expect(isAchievementComplete).toBe(false);
		});

		test('is not completed when we match metadata has incorrect scenario', async () => {
			const invalidMetadataEvent = {
				Type: 'MATCH_METADATA',
				Value: {
					ScenarioID: 1,
				},
			};
			const minimalPluginEvents = [cardPlayedEvent, mulliganDoneEvent, invalidMetadataEvent];
			const isAchievementComplete = await achievementsValidation([rawAchievement], minimalPluginEvents);
			expect(isAchievementComplete).toBe(false);
		});
	});
});
