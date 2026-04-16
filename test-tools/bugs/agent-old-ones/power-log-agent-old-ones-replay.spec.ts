/**
 * Card recap (hs-reference-data): Agent of the Old Ones (CATA_200) — 1-mana 2/1 Rogue Demon.
 * **Battlecry:** Choose a card in your hand to transform into a Coin.
 *
 * Regression: After the battlecry, hand entity 46 has `DISPLAYED_CREATOR=43` (Agent) but no
 * `SHOW_ENTITY` with CardID yet in the log for a long stretch. The parser/oracle should still infer
 * the card is **The Coin** (`GAME_005`) because the transform outcome is deterministic (not random).
 *
 * Fixture `agent-old-ones.log` is **truncated** after the battlecry sequence (before the first
 * `SHOW_ENTITY` for entity 46 as `GAME_005`) so the final replay state still has the hidden
 * transformed card. Full last-game log is available from the reporter’s power.zip if needed for UI.
 *
 * Ground truth from fixture: PowerTaskList sets `DISPLAYED_CREATOR value=43` on entity 46 while
 * `cardId=` remains empty until a much later line in the full log.
 *
 * Override: `POWER_LOG_AGENT_OLD_ONES_PATH` or `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/agent-old-ones/power-log-agent-old-ones-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Opponent hand entity transformed by Agent’s battlecry (see DISPLAYED_CREATOR=43 in the log). */
const TRANSFORM_TARGET_ENTITY_ID = 46;

describe('Power log replay → GameStateService (Agent of the Old Ones oracle)', () => {
	it(
		'replays truncated agent-old-ones.log and oracle-identifies the Coin (GAME_005) for the transform target before reveal',
		async () => {
			const logPath = resolvePowerLogPathForSlug('agent-old-ones');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'agent-old-ones-power-log-replay',
				settleMs: 12_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const slot = ctx.state.opponentDeck.hand.find((c) => c.entityId === TRANSFORM_TARGET_ENTITY_ID);

			expect(slot?.cardId).toBe(CardIds.TheCoinCore);
		},
		120_000,
	);
});
