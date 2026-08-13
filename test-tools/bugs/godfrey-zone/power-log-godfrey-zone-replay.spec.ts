/**
 * Regression: Godfrey-queued overdraws must leave the Godfrey zone once Atlas
 * returns them to hand (hand not full). Fixture ends with Atlas TAG_SCRIPT_DATA_NUM_2 = 0.
 *
 * Fixture: `godfrey-zone.log` (copy of test-tools/power.log). Local player is Chmielinho
 * (player 2); opponent WoodLVL99 has Godfrey. OverrideSpawn moves SETASIDE tokens to HAND
 * whenever the opponent plays a card with space; pending count ends at 0.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/godfrey-zone/power-log-godfrey-zone-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { buildGofreyCards } from '@firestone/game-state';
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
	parseGodfreyReturnedHandEntityIds,
	parseLastGodfreyAtlasPendingCount,
	parseOpponentGodfreyBurnedCards,
} from './godfrey-zone-power-log-helpers';

describe('Power log replay → GameStateService (Godfrey zone empties after returns)', () => {
	const slug = 'godfrey-zone';

	it('fixture: Atlas pending count is 0 after Godfrey overdraw returns', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const joined = logLines.join('\n');

		expect(joined).toContain('JAIL_509');
		expect(joined).toContain('JAILFX_Godfrey_CardsInHand_OverrideSpawn');

		const pending = parseLastGodfreyAtlasPendingCount(joined);
		expect(pending).toBe(0);

		const returnedEntityIds = parseGodfreyReturnedHandEntityIds(joined);
		expect(returnedEntityIds.length).toBeGreaterThan(0);

		const burned = parseOpponentGodfreyBurnedCards(joined);
		expect(burned.map((c) => c.cardId)).toEqual(expect.arrayContaining(['JAIL_514', 'MAW_001']));
		expect(burned.length).toBe(returnedEntityIds.length);
	});

	it('replays godfrey-zone.log; opponent Godfrey zone is empty because every queued card was returned', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const joined = logLines.join('\n');

		const pendingFromLog = parseLastGodfreyAtlasPendingCount(joined);
		const burnedFromLog = parseOpponentGodfreyBurnedCards(joined);
		expect(pendingFromLog).toBe(0);
		expect(burnedFromLog.length).toBeGreaterThan(0);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'godfrey-zone-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		expect(ctx.state.opponentDeck.globalEffects.some((c) => c.cardId === CardIds.GodfreytheBetrayer_JAIL_509)).toBe(
			true,
		);

		const burnedInState = ctx.state.opponentDeck.burnedCards.map((c) => c.cardId);
		for (const { cardId } of burnedFromLog) {
			expect(burnedInState).toContain(cardId);
		}

		const godfreyZone = buildGofreyCards(ctx.state.opponentDeck, ctx.state.parserState);
		expect(godfreyZone.map((c) => c.cardId)).toEqual([]);
		expect(godfreyZone.length).toBe(pendingFromLog);
	}, 180_000);
});
