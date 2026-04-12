/**
 * Regression: A SHATTERED spell piece drawn from deck via Dragonscale Armaments during Violet
 * Treasuregill’s battlecry must not show “Created by Violet Treasuregill”. The power log nests
 * shatter tasks under the minion PLAY block; parent-chain creator inference must not apply when
 * CREATOR / DISPLAYED_CREATOR are unset and the entity has SHATTERED.
 *
 * Fixture: last game only from support power.log — Dragonscale Armaments (EDR_251) draws a
 * Shatter spell; pieces include Flight Maneuvers token CATA_479t2.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/flight-maneuvers-gift/power-log-flight-maneuvers-gift-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (shatter piece not gift from battlecry minion)', () => {
	it(
		'replays flight-maneuvers-gift.log: Flight Maneuvers token (CATA_479t2) is not created by Violet Treasuregill',
		async () => {
			const logPath = resolvePowerLogPathForSlug('flight-maneuvers-gift');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'flight-maneuvers-gift-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const flightPieces = collectAllDeckCards(ctx.state).filter(
				(c) => c.cardId === CardIds.FlightManeuvers_FlightManeuversToken_CATA_479t2,
			);
			expect(flightPieces.length).toBeGreaterThan(0);

			for (const c of flightPieces) {
				expect(c.creatorCardId).not.toBe(CardIds.VioletTreasuregill_TLC_438);
			}
		},
		120_000,
	);
});
