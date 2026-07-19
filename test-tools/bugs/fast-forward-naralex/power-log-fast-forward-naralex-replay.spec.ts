/**
 * Regression: opponent plays Fast Forward (TIME_770), draws/reduces cards including Naralex Herald.
 * The local player must not see EDR_844 on the opponent's hidden hand slot (entity linked to the draw).
 *
 * Fixture: sliced from support power.log from GameState CREATE_GAME at line matching ranked rogue mirror
 * through Fast Forward resolution (SHOW_ENTITY Naralex token id=92 + hand buff id=57), ~3250 lines.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/fast-forward-naralex/power-log-fast-forward-naralex-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Opponent hand entity drawn during Fast Forward POWER block — stays UNKNOWN in log until played. */
const OPP_HAND_ENTITY_DRAWN_WITH_FF = 57;

describe('Power log replay → Fast Forward must not leak Naralex on opponent hand', () => {
	it(
		'fast-forward-naralex.log: opponent hand slot for FF-drawn card must not reveal Naralex Herald',
		async () => {
			const logPath = resolvePowerLogPathForSlug('fast-forward-naralex');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'fast-forward-naralex-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const slot = ctx.state.opponentDeck.hand.find((c) => c.entityId === OPP_HAND_ENTITY_DRAWN_WITH_FF);
			expect(slot).toBeTruthy();
			expect(slot!.cardId).not.toBe(CardIds.NaralexHeraldOfTheFlights_EDR_844);
		},
		240_000,
	);
});
