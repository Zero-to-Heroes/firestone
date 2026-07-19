/**
 * Opponent Q'onzu must not reveal the discovered spell on the local player's deck (CARD_BACK_TO_DECK path).
 *
 * Fixture: last game from support power.log, truncated after the Q'onzu placement (~line 7600) to keep size down.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/qonzu-top-deck/power-log-qonzu-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import { extractQonzuLeakedSpellIdFromPowerLogLines } from './qonzu-top-deck-power-log-helpers';

describe('Power log replay → Qonzu on local deck (no spell identity leak)', () => {
	it(
		'replays qonzu-top-deck.log: player deck must not show the spell id that the log exposes for Qonzu top-of-deck',
		async () => {
			const logPath = resolvePowerLogPathForSlug('qonzu');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const leakedSpellIdFromLog = extractQonzuLeakedSpellIdFromPowerLogLines(logLines);
			expect(leakedSpellIdFromLog).toBe('CORE_CS2_032');

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'qonzu-top-deck-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const qonzuTopSlots = ctx.state.playerDeck.deck.filter(
				(c) =>
					c.lastAffectedByCardId === CardIds.Qonzu_EDR_517 && c.positionFromTop != null,
			);
			expect(qonzuTopSlots.length).toBeGreaterThan(0);

			const leaked = qonzuTopSlots.filter((c) => c.cardId === leakedSpellIdFromLog);
			expect(leaked).toEqual([]);
		},
		180_000,
	);
});
