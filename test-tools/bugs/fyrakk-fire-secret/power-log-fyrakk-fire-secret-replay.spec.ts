/**
 * Regression: Fyrakk the Blazing battlecry puts a secret into play; unknown-secret options must be
 * Fire spell-school secrets only for that class (guessedInfo + SecretConfigService).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/fyrakk-fire-secret/power-log-fyrakk-fire-secret-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { AllCardsService, SpellSchool } from '@firestone-hs/reference-data';
import type { GameState } from '@firestone/game-state';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

/** Typical entity id in fyrakk-fire-secret.log: hunter secret from Fyrakk battlecry (opponent). May change if the fixture is re-captured. */
const FYRAKK_CAST_SECRET_ENTITY_ID = 256;

/**
 * Fyrakk creates an **unknown** secret; prefer the known fixture entity id, else any unrevealed secret with a narrowed pool.
 */
function findFyrakkNarrowedSecretPool(state: GameState) {
	const all = [...state.opponentDeck.secrets, ...state.playerDeck.secrets];
	return (
		all.find((s) => s.entityId === FYRAKK_CAST_SECRET_ENTITY_ID) ??
		all.find((s) => s.cardId === '' && s.allPossibleOptions.length > 0)
	);
}

function isFireSpellSchoolSecret(allCards: AllCardsService, cardId: string): boolean {
	const ref = allCards.getCard(cardId);
	return ref.spellSchool?.includes(SpellSchool[SpellSchool.FIRE]) ?? false;
}

describe('Power log replay → GameStateService (Fyrakk → Fire secrets only)', () => {
	it(
		'replays fyrakk-fire-secret.log: Fyrakk-cast secret options are Fire spell-school secrets',
		async () => {
			const slug = 'fyrakk-fire-secret';
			const logPath = resolvePowerLogPathForSlug(slug);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogFixtureExists(logPath);
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'fyrakk-fire-secret-replay',
				settleMs: 20_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const { state, allCardsRef } = ctx;
			const allCards = allCardsRef as AllCardsService;

			const boardSecret = findFyrakkNarrowedSecretPool(state);
			if (boardSecret == null) {
				const dump = (secrets: typeof state.opponentDeck.secrets) =>
					JSON.stringify(secrets.map((s) => ({ e: s.entityId, card: s.cardId, n: s.allPossibleOptions.length })));
				throw new Error(
					`Fyrakk unknown secret missing — opponent: ${dump(state.opponentDeck.secrets)} player: ${dump(
						state.playerDeck.secrets,
					)}`,
				);
			}

			const options = boardSecret!.allPossibleOptions;
			expect(options.length).toBeGreaterThan(0);

			const nonFire = options.filter((o) => !isFireSpellSchoolSecret(allCards, o.cardId)).map((o) => o.cardId);
			expect(nonFire).toEqual([]);
		},
		180_000,
	);
});
