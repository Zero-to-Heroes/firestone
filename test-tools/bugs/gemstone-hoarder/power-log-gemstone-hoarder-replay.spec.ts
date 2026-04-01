/**
 * Regression: Gemstone Hoarder deathrattle should resolve the returned card via the parser oracle
 * (enchantment TAG_SCRIPT_DATA_NUM_1 on TRIGGER deathrattle, not only POWER blocks).
 *
 * Fixture: `gemstone-hoarder.log` (last game trimmed from reporter power.zip). Override:
 * `POWER_LOG_GEMSTONE_HOARDER_PATH` or `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Ground truth from fixture: discarded card entity 5 was revealed as TLC_482 (Slagclaw) before
 * deathrattle returns a new hand entity (87) with DISPLAYED_CREATOR=22 (Hoarder).
 *
 * Run:
 *   npx jest test-tools/bugs/gemstone-hoarder/power-log-gemstone-hoarder-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Gemstone Hoarder deathrattle oracle)', () => {
	it(
		'replays gemstone-hoarder.log and identifies Slagclaw returned by Gemstone Hoarder deathrattle',
		async () => {
			const logPath = resolvePowerLogPathForSlug('gemstone-hoarder');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'gemstone-hoarder-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const fromHoarderDr = collectAllDeckCards(ctx.state).filter(
				(c) =>
					c.creatorCardId === CardIds.GemstoneHoarder_CATA_897 &&
					c.cardId === CardIds.Slagclaw_TLC_482,
			);
			expect(fromHoarderDr.length).toBeGreaterThan(0);
		},
		120_000,
	);
});
