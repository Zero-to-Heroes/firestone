/**
 * Regression: Libram of Divinity copy added via Libram of Divinity enchantment deathrattle
 * (BTFX_Librams_SpawnToHand_HolyLight_Book) should resolve to GDB_138 when the hand entity
 * starts with empty CardID and DISPLAYED_CREATOR = enchantment GDB_138e2.
 *
 * Fixture: `libram-divinity.log` (last game from reporter power.zip). Override: `POWER_LOG_LIBRAM_DIVINITY_PATH`.
 *
 * Run:
 *   npx jest test-tools/bugs/libram-divinity/power-log-libram-divinity-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Libram of Divinity oracle)', () => {
	it(
		'replays libram-divinity.log: hand entity 117 is identified as Libram of Divinity (GDB_138)',
		async () => {
			const logPath = resolvePowerLogPathForSlug('libram-divinity');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'libram-divinity-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const all = collectAllDeckCards(ctx.state);
			const hand117 = all.filter((c) => c.entityId === 117 && c.zone === 'HAND');
			expect(hand117.length).toBeGreaterThan(0);
			expect(hand117[0]!.cardId).toBe(CardIds.LibramOfDivinity_GDB_138);
		},
		120_000,
	);
});
