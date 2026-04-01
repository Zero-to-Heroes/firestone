/**
 * Regression: Fabled bundle cards played as Paladin auras / objectives emit QUEST_PLAYED (not CARD_PLAYED).
 * Opponent playing a bundle card (e.g. Gelbin's Mekkatorque's Aura TIME_009t2) must still add the rest of
 * the Fabled package to {@link DeckState.additionalKnownCardsInDeck}.
 *
 * Fixture: last game from support power.log (opponent plays TIME_009t2). Override: `FABLED_PACKAGE_POWER_LOG_PATH`
 * or `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/fabled-package-not-updated/power-log-fabled-package-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	isCardsJsonRefAvailable,
	replayPowerLogToGameState,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Fabled package on QUEST_PLAYED)', () => {
	it(
		'replays fabled-package.log: opponent Gelbin bundle card adds rest of package to known cards in deck',
		async () => {
			const logPath = resolvePowerLogPathForSlug('fabled-package');
			const cardsPath = resolveCardsJsonPath();
			if (!isCardsJsonRefAvailable(cardsPath) || !fs.existsSync(logPath)) {
				return;
			}
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'fabled-package-power-log-replay',
				settleMs: 12_000,
			});
			if (!ctx) {
				return;
			}

			const { state } = ctx;
			// Log: PlayerID=2 is the recorder (local); opponent (player 1) plays TIME_009t2 (Mekkatorque's Aura).

			const gelbinPackageRest = [
				CardIds.GelbinOfTomorrow_TIME_009,
				CardIds.GelbinOfTomorrow_GnomishAuraToken_TIME_009t1,
			];
			for (const id of gelbinPackageRest) {
				expect(state.opponentDeck.additionalKnownCardsInDeck).toContain(id);
			}
		},
		180_000,
	);
});
