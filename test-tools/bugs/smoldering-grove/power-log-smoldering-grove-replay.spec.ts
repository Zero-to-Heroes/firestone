/**
 * Regression: cards drawn by Smoldering Grove must not be tagged as belonging to a Rewind card.
 *
 * Reporter: cards drawn by Smoldering Grove (e.g. opponent entity 65) end up displayed as
 * "smoldering grove" in hand even though Smoldering Grove draws from the deck (no card creation
 * info should be public). The `CARD_DRAW_EVENT` for entity 65 carries
 * `lastInfluencedByCardId = "TIME_EVENT_999"` (Sands of Time, a Rewind card), which then flips
 * `isCreatorPublic` true downstream and stamps `lastAffectedByCardId = FIR_911` on the deck card.
 *
 * Fixture: trimmed single-game power.log (`CREATE_GAME` → end of Smoldering Grove's PLAY task list).
 * Inside Smoldering Grove's POWER block (line 5178+) opponent (player=2) entities 65, 45 and 47
 * transition `ZONE=DECK→HAND` (lines 5181, 5190, 5199). None of them carries any
 * `CREATOR` / `DISPLAYED_CREATOR` tag anywhere in the log; per game rules, drawing from your own
 * deck does not yield public creator info, so the tracker should leave creator/lastAffectedBy
 * empty for all three entities.
 *
 * Expected end-state: opponent hand entries for 65, 45, 47 have neither `creatorCardId` nor
 * `lastAffectedByCardId` set. Pre-fix the parser surfaces `TIME_EVENT_999` as
 * `lastInfluencedByCardId`, which makes the consumer set `lastAffectedByCardId = FIR_911`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/smoldering-grove/power-log-smoldering-grove-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Smoldering Grove draw attribution)', () => {
	it(
		'reporter log: cards drawn by Smoldering Grove have no creator / lastAffectedBy attribution',
		async () => {
			const logPath = resolvePowerLogPathForSlug('smoldering-grove');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'smoldering-grove-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const opponentHand = ctx.state.opponentDeck.hand;
			const drawnEntityIds = [65, 45, 47];

			for (const entityId of drawnEntityIds) {
				const card = opponentHand.find((c) => c.entityId === entityId);
				expect(card).toBeDefined();
				expect(card!.creatorCardId).toBeFalsy();
				expect(card!.lastAffectedByCardId).toBeFalsy();
			}
		},
		300_000,
	);
});
