/**
 * Card recap (reference: hs-reference-data): Wings of Hate — Demon Hunter ranked spell (ONY_016 /
 * ONY_016t / ONY_016t2). Summons Felwings; upgrades at 5 and 10 mana.
 *
 * Regression: Wings of Hate (ONY_016) — deck tracker must not keep a deck row for a card that is
 * already in hand (mulligan / ranked upgrade sequences in power.log).
 *
 * Fixture: `wings-of-hate.log` (last game from reporter power.zip). Override: `POWER_LOG_WINGS_OF_HATE_PATH`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/wings-of-hate/power-log-wings-of-hate-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Entity 50 is Wings of Hate in the reporter log (SHOW_ENTITY ONY_016, later ONY_016t). Local player is PlayerID=2. */
const WINGS_ENTITY_ID = 50;

describe('Power log replay → GameStateService (Wings of Hate deck vs hand)', () => {
	it('does not keep entity 50 in player deck while it is in hand', async () => {
		const logPath = resolvePowerLogPathForSlug('wings-of-hate');
		requirePowerLogFixtureExists(logPath);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'wings-of-hate-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const pd = ctx.state.playerDeck;
		const inDeck = pd.deck.filter((c) => c.entityId === WINGS_ENTITY_ID);
		const inHand = pd.hand.filter((c) => c.entityId === WINGS_ENTITY_ID);

		expect(inHand.length).toBeGreaterThan(0);
		expect(inDeck.length).toBe(0);
	}, 600_000);
});
