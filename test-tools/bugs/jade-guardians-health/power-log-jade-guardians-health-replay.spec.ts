/**
 * Regression: Jade Guardians counter must count cards played for 2 *Mana*, not 2 health.
 *
 * Blood Draw (TIME_612) costs Health instead of Mana. In this fixture it is played for
 * 2 health (Meta=SPEND_HEALTH Data=2) after a Cost -1 buff, so COST at play time is 2.
 * Jade Guardians TAG_SCRIPT_DATA_NUM_1 stays at 3; Firestone currently counts Blood Draw
 * and reports 4.
 *
 * Fixture: `jade-guardians-health.log` — last game from test-tools/power.log, truncated after
 * Blood Draw fully resolves (`EndCurrentTaskList` 417). Jade Guardians is still in hand so the
 * overlay counter is visible. Local player is Stormbrewer (player 1).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/jade-guardians-health/power-log-jade-guardians-health-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { countTwoManaCardsPlayedThisMatch } from '@firestone/game-state';
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
	BLOOD_DRAW_CARD_ID,
	BLOOD_DRAW_ENTITY_ID,
	extractLastJadeGuardiansScriptDataNum1,
	parseBloodDrawPlayLogFacts,
} from './jade-guardians-health-power-log-helpers';

describe('Power log replay → GameStateService (Jade Guardians ignores health-cost plays)', () => {
	const slug = 'jade-guardians-health';

	it('fixture: Jade TAG_SCRIPT_DATA_NUM_1 is 3; Blood Draw spends 2 health without incrementing Jade', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));

		expect(extractLastJadeGuardiansScriptDataNum1(logLines)).toBe(3);

		const bloodDraw = parseBloodDrawPlayLogFacts(logLines);
		expect(bloodDraw).not.toBeNull();
		expect(bloodDraw!.spendHealth).toBe(2);
		expect(bloodDraw!.jadeScriptUpdated).toBe(false);
		expect(logLines.filter((l) => l.length > 0).at(-1)).toContain(
			'PowerProcessor.EndCurrentTaskList() - m_currentTaskList=417',
		);
	});

	it('replays jade-guardians-health.log: 2-mana counter matches Jade script tag (excludes Blood Draw)', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const expectedFromLog = extractLastJadeGuardiansScriptDataNum1(logLines);
		expect(expectedFromLog).toBe(3);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'jade-guardians-health-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const bloodDrawPlayed = ctx.state.playerDeck.cardsPlayedThisMatch.find(
			(c) => c.cardId === CardIds.BloodDraw_TIME_612 && c.entityId === BLOOD_DRAW_ENTITY_ID,
		);
		expect(BLOOD_DRAW_CARD_ID).toBe(CardIds.BloodDraw_TIME_612);
		expect(bloodDrawPlayed).toBeDefined();
		expect(bloodDrawPlayed!.paidWithAlternateCost).toBe(true);

		expect(countTwoManaCardsPlayedThisMatch(ctx.state.playerDeck)).toBe(expectedFromLog);
	}, 120_000);
});
