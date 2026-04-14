/**
 * Regression: attack overlay must match Hearthstone for Magmaw (CATA_550) Colossal appendages
 * (COLOSSAL_LIMB): they spawn with EXHAUSTED=1 and must not count toward total attack until they can
 * attack (support report: overlay too high vs in-game).
 *
 * Fixture: last game from support power.log (GT_RANKED), trimmed with trimPowerLogLinesToLastGame,
 * then truncated after PowerTaskList line where `Magmaw's Body id=249` gets `tag=ATK value=4` in PLAY
 * (buff while still exhausted) — **line 32020** of the trimmed file — so the replay emits
 * TOTAL_ATTACK_ON_BOARD and `totalAttackOnBoard` is populated.
 *
 * With the pre-fix summoning rule (`RUSH`/`COLOSSAL_LIMB` skipped exhausted), replay yields **15**;
 * with the fix, **11** (matches Hearthstone).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/magmaw-attack/power-log-magmaw-attack-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Ground truth: at end of fixture replay, player total attack on board should equal this (not raw sum of all printed ATK including exhausted colossal limbs). */
const EXPECTED_PLAYER_ATTACK_ON_BOARD_TOTAL = 11;

describe('Power log replay → GameStateService (Magmaw / colossal limb attack counter)', () => {
	it('player totalAttackOnBoard matches in-game total (excludes exhausted COLOSSAL_LIMB)', async () => {
		const logPath = resolvePowerLogPathForSlug('magmaw-attack');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogFixtureExists(logPath);
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'magmaw-attack-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const ta = ctx.state.playerDeck.totalAttackOnBoard;
		const sum = (ta?.board ?? 0) + (ta?.hero ?? 0);
		expect(sum).toBe(EXPECTED_PLAYER_ATTACK_ON_BOARD_TOTAL);
	}, 180_000);
});
