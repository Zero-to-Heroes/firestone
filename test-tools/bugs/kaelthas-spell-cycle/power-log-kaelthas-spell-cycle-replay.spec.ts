/**
 * Kael'thas spell cycle: {@link formatKaelthasSpellCycleLabel} and replay smoke test for kaelthas.log.
 *
 * Fixture: `kaelthas.log` in this folder. Override: `POWER_LOG_KAELTHAS-SPELL-CYCLE_PATH` or env from harness.
 *
 * Run:
 *   npx jest test-tools/bugs/kaelthas-spell-cycle/power-log-kaelthas-spell-cycle-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { formatKaelthasSpellCycleLabel } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Kaelthas spell cycle counter (format + power log replay)', () => {
	it('formats 1/3 → 3/3 then wraps for the 4th spell in a turn', () => {
		expect(formatKaelthasSpellCycleLabel(0)).toBe('0/3');
		expect(formatKaelthasSpellCycleLabel(1)).toBe('1/3');
		expect(formatKaelthasSpellCycleLabel(2)).toBe('2/3');
		expect(formatKaelthasSpellCycleLabel(3)).toBe('3/3');
		expect(formatKaelthasSpellCycleLabel(4)).toBe('1/3');
	});

	it('replays kaelthas.log to GameState without error (smoke)', async () => {
		const logPath = resolvePowerLogPathForSlug('kaelthas-spell-cycle');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(lines.some((l) => l.includes('CREATE_GAME'))).toBe(true);

		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'kaelthas-spell-cycle-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);
		expect(ctx.state.playerDeck || ctx.state.opponentDeck).toBeTruthy();
	}, 120_000);
});
