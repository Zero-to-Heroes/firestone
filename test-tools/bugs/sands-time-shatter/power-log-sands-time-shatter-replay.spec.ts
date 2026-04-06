/**
 * Regression: SHATTERED opponent-hand guesses for Sands of Time + Shatter must not collapse to the
 * opponent’s deck/hero class. Asserts {@link getShatteredPossibleCards} with `canBeAnyCardClass`
 * includes off–deck-class SHATTERED tokens.
 *
 * Fixture: last game from the reporter’s support log, trimmed to **20614 lines** (from `CREATE_GAME`
 * through `WaitThenHideChoicesFromPacket … END WAIT` for the Sands discover after Shatter—stops
 * before the next `DebugPrintPowerList` / `SHOW_ENTITY` burst). Druid (`HERO_06`, player 1) vs
 * Warrior (`HERO_01`, player 2): replay as Warrior to see opponent deck / SHATTERED hand guesses.
 *
 * Re-trim from a full last-game export: `head -n 20614 <last-game-only.log> sands-time-shatter.log`
 * (re-derive line count with `rg` on this match if the source changes).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=<path-or-url-to-cards_short.json>
 *   npx jest test-tools/bugs/sands-time-shatter/power-log-sands-time-shatter-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */

import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';

import { DeckCard, getShatteredPossibleCards, hasCorrectClass } from '@firestone/game-state';

import {

	replayPowerLogToGameState,

	requirePowerLogReplayPrerequisites,

	requirePowerLogReplayResult,

	resolveCardsJsonPath,

	resolvePowerLogPathForSlug,

} from '../../lib/power-log-replay-harness';



describe('Power log replay → GameStateService (SHATTERED any-class pool / Sands of Time)', () => {

	it('reporter log: Sands of Time creator; canBeAnyCardClass pool is not deck-class-only', async () => {

		const logPath = resolvePowerLogPathForSlug('sands-time-shatter');

		const cardsPath = resolveCardsJsonPath();

		requirePowerLogReplayPrerequisites(cardsPath, logPath);



		const ctx = await replayPowerLogToGameState({

			logPath,

			reviewId: 'sands-time-shatter-replay',

		});

		requirePowerLogReplayResult(ctx, cardsPath);



		const sandsId = CardIds.SandsOfTime_TIME_EVENT_999;

		const shatteredInHand = ctx.state.opponentDeck.hand.filter(

			(c) => c.tags?.[GameTag.SHATTERED] === 1 && !c.cardId,

		) as DeckCard[];



		expect(shatteredInHand.length).toBeGreaterThanOrEqual(2);

		expect(shatteredInHand.every((c) => c.creatorCardId === sandsId)).toBe(true);

		for (const dc of shatteredInHand) {

			expect(dc.guessedInfo?.canBeAnyCardClass).toBe(true);

		}



		const { allCardsRef } = ctx;

		const opponentClass = ctx.state.opponentDeck.getCurrentClassEnum() ?? CardClass.NEUTRAL;

		expect(opponentClass).toBe(CardClass.DRUID);



		for (const dc of shatteredInHand) {

			const pool = dc.guessedInfo?.possibleCards ?? [];

			expect(pool.length).toBeGreaterThan(0);

			const hasOffDeckClass = pool.some(

				(id) => !hasCorrectClass(allCardsRef.getCard(id), opponentClass),

			);

			expect({ entityId: dc.entityId, hasOffDeckClass }).toEqual(

				expect.objectContaining({ hasOffDeckClass: true }),

			);

		}



		const anyClassPool = getShatteredPossibleCards(ctx.state.opponentDeck, allCardsRef, {

			canBeAnyCardClass: true,

		});

		expect(anyClassPool.length).toBeGreaterThan(0);

		const hasOffDeckShattered = anyClassPool.some(

			(id) => !hasCorrectClass(allCardsRef.getCard(id), opponentClass),

		);

		expect(hasOffDeckShattered).toBe(true);

	}, 120_000);

});


