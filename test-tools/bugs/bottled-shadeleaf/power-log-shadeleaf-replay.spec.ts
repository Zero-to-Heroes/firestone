/**
 * Regression: each Bottled Shadeleaf (WW_393t) should get {@link DeckCard.mainAttributeChange}
 * from its own TAG_SCRIPT_DATA_NUM_1 (not the first damage meta from the spell block).
 *
 * Fixture: `bottled-shadeleaf.log`. Override: `POWER_LOG_SHADELEAF_PATH`, `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run:
 *   npx jest test-tools/bugs/bottled-shadeleaf/power-log-shadeleaf-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
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
import { extractBottledShadeleafScriptDataNum1ByEntityId } from './shadeleaf-power-log-helpers';

describe('Power log replay → GameStateService (Bottled Shadeleaf mainAttributeChange)', () => {
	it('parses distinct TAG_SCRIPT_DATA_NUM_1 per Bottled Shadeleaf entity from fixture', () => {
		const logPath = resolvePowerLogPathForSlug('shadeleaf');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const byId = extractBottledShadeleafScriptDataNum1ByEntityId(logLines);
		expect(byId.get(200)).toBe(5);
		expect(byId.get(201)).toBe(10);
	});

	it(
		'replays fixture and sets mainAttributeChange per WW_393t entity from log',
		async () => {
			const logPath = resolvePowerLogPathForSlug('shadeleaf');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const expectedByEntity = extractBottledShadeleafScriptDataNum1ByEntityId(logLines);

			const ctx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: logLines,
				reviewId: 'shadeleaf-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const bottles = collectAllDeckCards(ctx.state).filter(
				(c) => c.cardId === CardIds.InvasiveShadeleaf_BottledShadeleafToken_WW_393t,
			);
			expect(bottles.length).toBeGreaterThanOrEqual(2);

			for (const [entityId, expected] of expectedByEntity) {
				const card = bottles.find((b) => b.entityId === entityId);
				expect(card).toBeDefined();
				expect(card!.mainAttributeChange).toBe(expected);
			}
		},
		120_000,
	);
});
