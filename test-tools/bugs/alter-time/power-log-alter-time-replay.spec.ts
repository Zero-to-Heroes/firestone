/**
 * Regression: Alter Time (TIME_857) discovers Arcane spells from Wild; Secret Helper must not list
 * non-Arcane Mage secrets when the board secret was created with creatorCardId Alter Time and the
 * secret identity is still unknown (card null in getValidSecrets).
 *
 * Fixture: single match from reporter power.log (game starting ~15:39:15), trimmed to end right
 * after Alter Time (TIME_857) finishes resolving (~15:43:17, EndCurrentTaskList=420). Not the raw
 * "last game" of the original file — that segment was incomplete.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/alter-time/power-log-alter-time-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Alter Time secret pool)', () => {
	it(
		'replays alter-time.log and SecretConfigService restricts Alter Time creator pool to Arcane secrets',
		async () => {
			const logPath = resolvePowerLogPathForSlug('alter-time');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogFixtureExists(logPath);
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'alter-time-secret-pool',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const { state, secretConfigService, allCardsRef } = ctx;
			const mageSecretsForAlterTime = await secretConfigService.getValidSecrets(
				state.metadata,
				'mage',
				state,
				null,
				CardIds.AlterTime_TIME_857,
				undefined,
			);

			expect(mageSecretsForAlterTime.length).toBeGreaterThan(0);

			const nonArcane: string[] = [];
			for (const secretCardId of mageSecretsForAlterTime) {
				const ref = allCardsRef.getCard(secretCardId);
				expect(ref.mechanics?.includes(GameTag[GameTag.SECRET])).toBe(true);
				const schools = ref.spellSchool;
				if (!schools?.includes(SpellSchool[SpellSchool.ARCANE])) {
					nonArcane.push(secretCardId);
				}
			}
			expect(nonArcane).toEqual([]);
		},
		180_000,
	);
});
