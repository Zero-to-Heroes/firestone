/**
 * Regression: attack overlay (totalAttackOnBoard) must reflect potential face damage, not raw
 * board attack. At the truncation snapshot below the active player has just summoned a board of
 * fresh RUSH minions (Onyxia, Al'Akir, three Onyxian Whelps) plus two `JUST_PLAYED` Charged Hands
 * of Al'Akir; the player hero has 0 attack and no weapon.
 *
 * Game options for every minion include `error=REQ_MINION_TARGET` against both heroes
 * (cannot attack hero on the summon turn) and the hero option reports `REQ_ATTACK_GREATER_THAN_0`,
 * so the correct face-damage total is exactly 0.
 *
 * This snapshot is the negative case for the fresh-rush rule in
 * `libs/power-log-parser/src/lib/parsers/attack-on-board-summoning.ts`. To verify red/green: revert
 * `hasSummoningSicknessForAttackOnBoard` to a version that does not treat fresh-summon RUSH /
 * COLOSSAL_LIMB minions as sick (e.g. `if (RUSH || COLOSSAL_LIMB) return false;`) and this test
 * should fail with a non-zero `Received`.
 *
 * Fixture: last game from support `power.log` (trimmed with `trimPowerLogLinesToLastGame`),
 * truncated to **23539 lines** — the last line is immediately before the next `FULL_ENTITY` block
 * in the Onyxia / Al'Akir lethal turn (`acz-last-game.log` line 23540).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/attack-counter-zero/power-log-attack-counter-zero-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (attack counter)', () => {
	it('player totalAttackOnBoard is zero when every minion was just summoned with rush', async () => {
		const logPath = resolvePowerLogPathForSlug('attack-counter-zero');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogFixtureExists(logPath);
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'attack-counter-zero-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const ta = ctx.state.playerDeck.totalAttackOnBoard;
		const sum = (ta?.board ?? 0) + (ta?.hero ?? 0);
		expect(sum).toBe(0);
	}, 120_000);
});
