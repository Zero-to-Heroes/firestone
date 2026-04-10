/**
 * Malevolent Mutant: copy of a Fel spell shares identity with the chosen card; playing **either**
 * the copy or the original should let the deck tracker infer the same `cardId` on the other.
 *
 * ## Fixture play order (read this before debugging)
 *
 * In `malevolent-mutant.log`, **entity 135** is the **chosen** Fel spell (Mutant’s target). **Entity 142**
 * is the **extra copy** added by Mutant (`COPIED_FROM_ENTITY_ID` = 135 on the copy). This log plays the
 * **copy (142) first** (Flash Flood / `CATA_533`); **135 stays in hand** and must be updated to the same
 * `cardId` — that is what we assert.
 *
 * This fixture does **not** include the reverse order (“play **135** first, then **142** in hand should
 * light up”). Covering that requires a different power.log where the original is cast before the copy.
 *
 * ## Red / green
 *
 * Regression is **only** this replay: same pipeline as the app (`GameEvents` → `GameStateService`).
 * Removing the `COPIED_FROM_ENTITY_ID` / `cardCopyLinks` / obfuscation fixes should make this test fail
 * with `cardId` null or wrong on entity 135.
 *
 * Fixture: last game from support power.log, truncated after the copy spell play fully resolves (end of
 * task list 556), before unrelated hero-power lines.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/malevolent-mutant/power-log-malevolent-mutant-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	collectAllDeckCards,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

/** From fixture: Fel spell identity once revealed (Flash Flood in log). */
const EXPECTED_FEL_SPELL_CARD_ID = 'CATA_533';
/** Chosen spell (stays in hand when copy is played first in this log). */
const CHOSEN_SPELL_ENTITY_ID = 135;
/** Mutant-generated copy (`COPIED_FROM_ENTITY_ID` → chosen spell). Played first in this fixture. */
const MUTANT_COPY_ENTITY_ID = 142;

describe('Power log replay → GameStateService (Malevolent Mutant copy ↔ original)', () => {
	it(
		'replays malevolent-mutant.log: copy (142) played first → chosen spell (135) gets same cardId',
		async () => {
			const logPath = resolvePowerLogPathForSlug('malevolent-mutant');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'malevolent-mutant-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const all = collectAllDeckCards(ctx.state);
			const chosenStillInHand = all.find((c) => c.entityId === CHOSEN_SPELL_ENTITY_ID);
			expect(chosenStillInHand).toBeTruthy();
			expect(chosenStillInHand!.cardId).toBe(EXPECTED_FEL_SPELL_CARD_ID);

			const mutantCopy = all.find((c) => c.entityId === MUTANT_COPY_ENTITY_ID);
			expect(mutantCopy).toBeTruthy();
			expect(mutantCopy!.cardId).toBe(EXPECTED_FEL_SPELL_CARD_ID);
		},
		120_000,
	);
});
