/**
 * Regression: Fyrakk the Blazing battlecry puts a secret into play; unknown-secret options must be
 * Fire spell-school secrets only for that class (guessedInfo + SecretConfigService).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/fyrakk-fire-secret/power-log-fyrakk-fire-secret-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { AllCardsService, SpellSchool } from '@firestone-hs/reference-data';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

/** Entity id from trimmed fixture: hunter secret cast during Fyrakk battlecry (opponent). */
const FYRAKK_CAST_SECRET_ENTITY_ID = 256;

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
				settleMs: 12_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const { state, allCardsRef } = ctx;
			const allCards = allCardsRef as AllCardsService;

			const opponentSecrets = state.opponentDeck.secrets.filter((s) => s.entityId === FYRAKK_CAST_SECRET_ENTITY_ID);
			const playerSecrets = state.playerDeck.secrets.filter((s) => s.entityId === FYRAKK_CAST_SECRET_ENTITY_ID);
			const boardSecret = opponentSecrets[0] ?? playerSecrets[0];
			expect(boardSecret).toBeDefined();

			const options = boardSecret!.allPossibleOptions;
			expect(options.length).toBeGreaterThan(0);

			const nonFire = options.filter((o) => !isFireSpellSchoolSecret(allCards, o.cardId)).map((o) => o.cardId);
			expect(nonFire).toEqual([]);
		},
		180_000,
	);
});
