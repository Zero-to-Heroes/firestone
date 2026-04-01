/**
 * Regression: Ysondre counter should show on the opponent column when only the opponent runs Ysondre
 * (reporter log: support bundle `83ad3b11-fbdd-465b-9640-7a0650b0eea9.power.zip`).
 *
 * Fixture: `ysondre.log` — last game only (`trimPowerLogLinesToLastGame` from full `power.log`).
 * Regenerate from zip: extract `power.log`, run `npx tsx` on a one-off script that reads `tmp_extract/power.log`
 * and writes `ysondre.log` via `trimPowerLogLinesToLastGame` (see bug playbook).
 *
 * Override: `YSONDRE_POWER_LOG_PATH` or `POWER_LOG_YSONDRE_PATH`, `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run (use a **local** `cards_short.json` if Jest/Node has no `fetch` for HTTPS):
 *   export HS_REFERENCE_CARDS_JSON_PATH=/path/to/hs-reference-data/src/cards_short.json
 *   npx jest test-tools/bugs/ysondre/power-log-ysondre-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 *
 * Red/green check (2026-04): with pre-fix `YsondreCounterDefinitionV2` (global `!!value` on player, no `opponent`
 * block), the replay test **fails** on `isActive('player') === false`. With the current implementation it **passes**.
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState, YsondreCounterDefinitionV2 } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import { countOpponentYsondreGraveyardTransitions } from './ysondre-power-log-helpers';

const ysondreId = CardIds.Ysondre_EDR_465;

describe('Power log replay → GameStateService (Ysondre counter column)', () => {
	it('ysondre.log records opponent (player=2) Ysondre dying at least once', () => {
		const logPath = resolvePowerLogPathForSlug('ysondre');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const graveyardMoves = countOpponentYsondreGraveyardTransitions(logLines);
		expect(graveyardMoves).toBeGreaterThan(0);
	});

	it(
		'replays ysondre.log: opponent Ysondre deaths → counter active on opponent only',
		async () => {
			const logPath = resolvePowerLogPathForSlug('ysondre');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'ysondre-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const state: GameState = ctx.state;
			const opponentYsondreDeaths = state.opponentDeck.minionsDeadThisMatch.filter(
				(e) => e.cardId === ysondreId,
			).length;
			const playerYsondreDeaths = state.playerDeck.minionsDeadThisMatch.filter(
				(e) => e.cardId === ysondreId,
			).length;

			expect(opponentYsondreDeaths).toBeGreaterThan(0);
			expect(playerYsondreDeaths).toBe(0);

			const i18n = {
				translateString: (key: string, _params?: Record<string, unknown>) => key,
			} as ILocalizationService;
			const allCards = ctx.allCardsRef as unknown as CardsFacadeService;
			const counter = new YsondreCounterDefinitionV2(i18n, allCards);
			counter.init({ arena: [] });

			const prefs = {
				playerYsondreCounter: true,
				opponentYsondreCounter: true,
			} as unknown as Preferences;

			expect(counter.isActive('player', state, state.bgState, prefs)).toBe(false);
			expect(counter.isActive('opponent', state, state.bgState, prefs)).toBe(true);
		},
		120_000,
	);
});
