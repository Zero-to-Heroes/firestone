/**
 * Regression: opponent weapon (Remornia REV_316t) breaks via PLAY → SETASIDE + MAIN_HAND_WEAPON_ENTITY=0.
 * Previously only ZONE → GRAVEYARD emitted WEAPON_DESTROYED, so the tracker kept the weapon.
 *
 * Fixture: `remornia-weapon.log` (last game, trimmed after weapon-loss sequence). Override: `POWER_LOG_REMORNIA_PATH`.
 *
 * Run:
 *   npx jest test-tools/bugs/remornia-weapon/power-log-remornia-weapon-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Remornia weapon cleared on SETASIDE)', () => {
	it(
		'clears opponent weapon after REV_316t leaves play to SETASIDE (not only GRAVEYARD)',
		async () => {
			const logPath = resolvePowerLogPathForSlug('remornia');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'remornia-weapon-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expect(ctx.state.opponentDeck.weapon).toBeNull();
		},
		120_000,
	);
});
