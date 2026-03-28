/**
 * Regression: Torch (CATA_585) should carry {@link DeckCard.mainAttributeChange} from excess damage
 * (TAG_SCRIPT_DATA_NUM_1 / StoredAmount in receive flow).
 *
 * Fixture: `test-tools/power-logs/torch.log` (bug report game log, last match only).
 * Override: `TORCH_POWER_LOG_PATH` or `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run:
 *   npx jest libs/game-state/src/testing/power-log-torch-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../../../test-tools/lib/trim-power-log-last-game';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from './power-log-replay-harness';
import { extractTorchScriptDataNum1ValuesFromPowerLogLines } from './torch-power-log-helpers';

describe('Power log replay → GameStateService (Torch mainAttributeChange)', () => {
	it('parses TAG_SCRIPT_DATA_NUM_1 values for Torch from torch.log (excess damage hints)', () => {
		const logPath = resolvePowerLogPathForSlug('torch');
		if (!fs.existsSync(logPath)) {
			return;
		}
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const scriptVals = extractTorchScriptDataNum1ValuesFromPowerLogLines(logLines);
		const unique = [...new Set(scriptVals)].sort((a, b) => a - b);
		expect(unique.length).toBeGreaterThan(0);
		expect(unique).toContain(6);
		expect(unique).toContain(8);
	});

	it(
		'replays torch.log and sets mainAttributeChange on Torch cards from stored excess',
		async () => {
			const logPath = resolvePowerLogPathForSlug('torch');
			const cardsPath = resolveCardsJsonPath();
			if (!fs.existsSync(cardsPath) || !fs.existsSync(logPath)) {
				return;
			}
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'torch-power-log-replay',
			});
			if (!ctx) {
				return;
			}

			const torches = collectAllDeckCards(ctx.state).filter((c) => c.cardId === CardIds.Torch_CATA_585);
			expect(torches.length).toBeGreaterThan(0);

			const withMainAttribute = torches.filter(
				(t) => t.mainAttributeChange != null && t.mainAttributeChange > 0,
			);
			expect(withMainAttribute.length).toBeGreaterThan(0);
		},
		120_000,
	);
});
