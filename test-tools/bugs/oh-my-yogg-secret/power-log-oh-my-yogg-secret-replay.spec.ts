/**
 * Regression: Oh My Yogg transforms a cast spell into a secret — SECRET_PLAYED can carry the spell's
 * CardId before the real secret is shown. BoardSecret must list class secrets, not only the cast spell.
 *
 * Fixture: last game from reporter power.log (Frostbolt → Hunter secret, entity id=50 in log).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/oh-my-yogg-secret/power-log-oh-my-yogg-secret-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Oh My Yogg secret options)', () => {
	const transformedEntityId = 50;
	const castSpellId = CardIds.FrostboltLegacy;

	it(
		'after Oh My Yogg, the new secret does not collapse to only the cast spell',
		async () => {
		const logPath = resolvePowerLogPathForSlug('oh-my-yogg-secret');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogFixtureExists(logPath);
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'oh-my-yogg-secret-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state, allCardsRef } = ctx;
		const allBoardSecrets = [...state.playerDeck.secrets, ...state.opponentDeck.secrets];
		const forEntity = allBoardSecrets.filter((s) => s.entityId === transformedEntityId);
		if (!forEntity.length) {
			throw new Error(
				`Expected a BoardSecret for entity ${transformedEntityId} (Oh My Yogg transform in fixture).`,
			);
		}
		// Same entity can be processed from GameState vs PowerTaskList; prefer the entry with the full option pool.
		const secret = forEntity.reduce((best, s) =>
			s.allPossibleOptions.length > best.allPossibleOptions.length ? s : best,
			forEntity[0]!,
		);

		// Bug: BoardSecret used the cast spell id (Frostbolt) as the only "secret" option. Accept either
		// a full class pool or a single real secret once the log has resolved the transformed card.
		const onlyTheCastSpell =
			secret.allPossibleOptions.length === 1 && secret.allPossibleOptions[0]!.cardId === castSpellId;
		expect(onlyTheCastSpell).toBe(false);

		for (const opt of secret.allPossibleOptions) {
			const ref = allCardsRef.getCard(opt.cardId);
			expect(ref.mechanics?.includes(GameTag[GameTag.SECRET])).toBe(true);
		}
		},
		120_000,
	);
});
