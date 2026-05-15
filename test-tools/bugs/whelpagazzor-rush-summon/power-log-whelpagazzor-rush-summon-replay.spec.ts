/**
 * Regression: a freshly-summoned RUSH minion (`REV_314t` Whelpagazzor) must NOT count toward the
 * "total attack on board" overlay on the turn it enters play. RUSH minions can attack other minions
 * but not the enemy hero on their summon turn (game options return `error=REQ_MINION_TARGET` for
 * hero targets), so for face-damage purposes they are summoning-sick.
 *
 * Fixture snapshot: after the active player (Chmielinho, player 2) summons Whelpagazzor 174 from
 * Topior the Shrubbagazzor's trigger. At the snapshot the player 2 board is:
 *   - Topior the Shrubbagazzor (id=63, REV_314): ATK=6, NUM_TURNS_IN_PLAY=2 → can hit hero (counts 6)
 *   - Ancient (id=172, REV_336t3): ATK=5, EXHAUSTED=1 (Plot of Sin spawn) → sick (excludes)
 *   - Ancient (id=173, REV_336t3): ATK=5, EXHAUSTED=1 (Plot of Sin spawn) → sick (excludes)
 *   - Whelpagazzor (id=174, REV_314t): ATK=3, RUSH=1, EXHAUSTED=0, NUM_TURNS_IN_PLAY=0 → fresh-rush,
 *     cannot hit hero this turn (REQ_MINION_TARGET in `test-tools/power.log` line 14081-14091).
 *   - Hero Old Ways Ulfar (id=74): 0 ATK, no weapon.
 *
 * Pre-fix (RUSH/COLOSSAL_LIMB only checks EXHAUSTED): board=9 (6 + 3), hero=0, total=9.
 * Post-fix (also treats `NUM_TURNS_IN_PLAY === 0` as sick): board=6, hero=0, total=6.
 *
 * Fixture: first 14253 lines of `test-tools/power.log` — ends at the Block End for the
 * `ATTACKABLE_BY_RUSH=1` PowerTaskList block on entity 174, which triggers the parser's
 * AppliesOnCloseNode and emits a `TOTAL_ATTACK_ON_BOARD` event reflecting the post-summon state.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/whelpagazzor-rush-summon/power-log-whelpagazzor-rush-summon-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Topior (6 ATK) is the only attacker that can hit hero; the 3-ATK fresh-rush whelp must be excluded. */
const EXPECTED_PLAYER_ATTACK_ON_BOARD_TOTAL = 6;

describe('Power log replay → GameStateService (fresh-rush attack counter)', () => {
	it('player totalAttackOnBoard excludes a freshly-summoned RUSH minion (cannot hit hero)', async () => {
		const logPath = resolvePowerLogPathForSlug('whelpagazzor-rush-summon');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogFixtureExists(logPath);
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'whelpagazzor-rush-summon-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const ta = ctx.state.playerDeck.totalAttackOnBoard;
		const sum = (ta?.board ?? 0) + (ta?.hero ?? 0);
		expect(sum).toBe(EXPECTED_PLAYER_ATTACK_ON_BOARD_TOTAL);
	}, 180_000);
});
