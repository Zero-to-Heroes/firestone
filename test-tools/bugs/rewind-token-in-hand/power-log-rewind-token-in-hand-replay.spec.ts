/**
 * Regression: rewind discover/choose-one tokens must not leak into the opponent's hand.
 *
 * Reporter: "There is a 'Rewind Timeline' card in the opponent's hand" while replaying the attached
 * log. Rewind Timeline (`TIME_000tb`) and Keep Timeline (`TIME_000ta`) are transient choice tokens
 * spawned by REWIND-mechanic cards (Sands of Time, Blessing of the Bronze, ...). They live in
 * `SETASIDE` while the player picks one, then either go straight to `GRAVEYARD` (unchosen) or are
 * cloned to a new entity that goes `SETASIDE -> PLAY -> GRAVEYARD` (chosen). They never legitimately
 * enter `HAND`, so any `DeckCard` with `cardId === 'TIME_000ta' | 'TIME_000tb'` left in
 * `opponentDeck.hand` at end of replay is unambiguously a tracker bug.
 *
 * Fixture: single-game power.log, Mage (Jaina, P2/local) vs Rogue (Chmielinho#2928, P1/opponent).
 * Two opponent uses of Blessing of the Bronze (`END_000p`) are recorded:
 *  - 1st (BLOCK_START at line 17037): choice id=12 between Keep Timeline id=186 and Rewind Timeline
 *    id=187. Opponent picks Rewind Timeline 187 (line 17086); the engine spawns id=188 which goes
 *    `SETASIDE -> PLAY -> GRAVEYARD` (lines 19127-19172).
 *  - 2nd (BLOCK_START at line 24265): choice id=13 between Keep Timeline id=208 and Rewind Timeline
 *    id=209. Opponent picks Keep Timeline 208 (line 24417); the engine spawns id=210 which goes
 *    `SETASIDE -> PLAY -> GRAVEYARD` (lines 24484-24549).
 * Entity 209 (Rewind Timeline, controller=1, REWIND=1) is never moved out of `SETASIDE` anywhere in
 * the log — confirmed via `Entity=209|id=209|ID=209` ripgrep — so the post-replay tracker invariant
 * `opponentDeck.hand` contains no `TIME_000ta` and no `TIME_000tb` is grounded in the fixture, not
 * guessed.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/rewind-token-in-hand/power-log-rewind-token-in-hand-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (rewind token leaks into opponent hand)', () => {
	it("reporter log: opponent's hand never contains Keep/Rewind Timeline tokens at end of replay", async () => {
		const logPath = resolvePowerLogPathForSlug('rewind-token-in-hand');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'rewind-token-in-hand-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		// Note: in the harness the parser identifies the local player from SHOW_ENTITY-in-HAND,
		// so the `playerDeck` here is the Rogue (Chmielinho, PlayerID=1) and `opponentDeck` is
		// the Mage (UNKNOWN HUMAN PLAYER, PlayerID=2). The reporter saw Rewind Timeline in the
		// (test-perspective) opponent's hand, which is the Mage who actually played Sands of
		// Time + Scrappy Scavenger across the rewind.
		const hand = ctx.state.opponentDeck.hand;
		const keep = hand.find((c) => c.cardId === 'TIME_000ta');
		const rewind = hand.find((c) => c.cardId === 'TIME_000tb');
		// Reporter saw Rewind Timeline; assert the broader invariant that neither rewind choice
		// token can end up in opponent hand. Pre-fix the harness reports `rewind` defined here.
		expect(rewind).toBeUndefined();
		expect(keep).toBeUndefined();
	}, 300_000);
});
