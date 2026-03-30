/**
 * Regression: opponent recombined SHATTER card must not list every SHATTER card in the game when
 * `guessedInfo.cardClasses` is unset—pool should match opponent deck class (see getShatteredRecombinedPossibleCards).
 *
 * Fixture: opponent Druid (HERO_06j), recombined entity 118 after CATAFX_Shattered_Combined_OverrideSpawn_Super.
 *
 * Run:
 *   npx jest test-tools/bugs/shatter-recombine/power-log-shatter-recombine-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardClass, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, hasCorrectClass } from '@firestone/game-state';
import {
	replayPowerLogToGameState,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (shatter recombine possibleCards)', () => {
	it('restricts recombined SHATTER guessed pool to opponent class, not all SHATTER cards', async () => {
		const logPath = resolvePowerLogPathForSlug('shatter-recombine');
		const cardsPath = resolveCardsJsonPath();
		if (!fs.existsSync(cardsPath) || !fs.existsSync(logPath)) {
			return;
		}

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'shatter-recombine-replay',
		});
		if (!ctx) {
			return;
		}

		const { allCardsRef, state } = ctx;
		const opponent = state.opponentDeck;
		const oppClass = opponent.getCurrentClassEnum();
		expect(oppClass).toBe(CardClass.DRUID);

		const recombined = opponent.hand.find((c) => c.entityId === 118) as DeckCard | undefined;
		expect(recombined).toBeDefined();

		const pool = recombined!.guessedInfo?.possibleCards ?? [];
		expect(pool.length).toBeGreaterThan(0);

		const allShatterCount = allCardsRef
			.getCards()
			.filter((c) => c.mechanics?.includes(GameTag[GameTag.SHATTER])).length;
		expect(allShatterCount).toBeGreaterThan(pool.length);

		for (const cardId of pool) {
			const ref = allCardsRef.getCard(cardId);
			expect(ref.mechanics?.includes(GameTag[GameTag.SHATTER])).toBe(true);
			expect(hasCorrectClass(ref, oppClass ?? null)).toBe(true);
		}
	}, 120_000);
});
