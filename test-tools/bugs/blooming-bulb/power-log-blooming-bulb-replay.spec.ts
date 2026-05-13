/**
 * Regression: Blooming Bulb (MEND_100t) stores spell-cost tier in TAG_SCRIPT_DATA_NUM_1; upgrades use
 * SUB_SPELL VFX without TAG_CHANGE in power.log — {@link BloomingBulbScriptUpgradeParser} syncs tier.
 *
 * Fixture: `blooming-bulb.log`. Override: `POWER_LOG_BLOOMING_BULB_PATH` or `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run:
 *   npx jest test-tools/bugs/blooming-bulb/power-log-blooming-bulb-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	countRankedSpellUpgradeSubSpellsInPowerTaskList,
	expectedScriptTierAfterReplay,
} from './blooming-bulb-power-log-helpers';

describe('Power log replay → GameStateService (Blooming Bulb script tier)', () => {
	it('derives expected tier from PowerTaskList SUB_SPELL upgrade lines in blooming-bulb.log', () => {
		const logPath = resolvePowerLogPathForSlug('blooming-bulb');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const upgrades = countRankedSpellUpgradeSubSpellsInPowerTaskList(logLines);
		expect(upgrades).toBeGreaterThan(0);
		expect(expectedScriptTierAfterReplay(logLines)).toBe(1 + upgrades);
	});

	it(
		'replays blooming-bulb.log and updates TAG_SCRIPT_DATA_NUM_1 on Blooming Bulb after each upgrade VFX',
		async () => {
			const logPath = resolvePowerLogPathForSlug('blooming-bulb');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const expectedTier = expectedScriptTierAfterReplay(logLines);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'blooming-bulb-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const bulbs = collectAllDeckCards(ctx.state).filter(
				(c) => c.cardId === CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t,
			);
			expect(bulbs.length).toBeGreaterThan(0);
			const bulb = bulbs[0]!;
			const tier = bulb.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
			expect(tier).toBe(expectedTier);
		},
		120_000,
	);
});
