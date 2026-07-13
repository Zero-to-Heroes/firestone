/**
 * Regression: Repackage (TOY_879) should add exactly one Repackaged Box (TOY_879t) to the opponent deck.
 *
 * Fixture: `repackage-box.log` in this folder.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/repackage-box/power-log-repackage-box-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
import {
	countRepackageBoxSpawnsInOpponentDeckFromPowerLogLines,
	extractRepackageStuffedMinionEntityIdsFromPowerLogLines,
} from './repackage-power-log-helpers';

describe('Power log replay → GameStateService (Repackage box in opponent deck)', () => {
	it('parses Repackage resolution from repackage-box.log (10 minions stuffed, 1 box in opp deck)', () => {
		const logPath = resolvePowerLogPathForSlug('repackage-box');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));

		const stuffedMinionIds = extractRepackageStuffedMinionEntityIdsFromPowerLogLines(logLines);
		expect(stuffedMinionIds.length).toBe(10);
		expect(new Set(stuffedMinionIds).size).toBe(10);

		const boxSpawns = countRepackageBoxSpawnsInOpponentDeckFromPowerLogLines(logLines);
		expect(boxSpawns).toBe(1);
	});

	it(
		'replays repackage-box.log and tracks exactly one Repackaged Box in opponent deck',
		async () => {
			const logPath = resolvePowerLogPathForSlug('repackage-box');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'repackage-box-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const oppDeck = ctx.state.opponentDeck.deck;
			const boxes = oppDeck.filter((c) => c.cardId === CardIds.Repackage_RepackagedBoxToken_TOY_879t);
			expect(boxes.length).toBe(1);
		},
		120_000,
	);
});
