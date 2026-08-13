/**
 * Regression: opponent Tiny Pal (JAIL_458, entity 40) still appears in the deck tracker
 * Board zone after it breaks. Board includes `opponentDeck.weapon`.
 *
 * Fixture: `tiny-pal.log`. Tiny Pal transforms in PLAY (CHANGE_ENTITY to JAIL_458t4),
 * then ZONE → GRAVEYARD + MAIN_HAND_WEAPON_ENTITY=0.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/tiny-pal/power-log-tiny-pal-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	isTinyPalCardId,
	parseTinyPalFixtureMarkers,
	TINY_PAL_ENTITY_ID,
	TINY_PAL_LOG_PATH,
	TINY_PAL_OPPONENT_CONTROLLER,
} from './tiny-pal-power-log-helpers';

describe('Power log replay → GameStateService (Tiny Pal cleared from Board after break)', () => {
	it('fixture: tiny-pal.log contains CHANGE_ENTITY, GRAVEYARD, and weapon-cleared markers for entity 40', () => {
		const logPath = resolvePowerLogPathForSlug('tiny-pal');
		expect(logPath).toBe(TINY_PAL_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
		expect(lines.some((line) => line.includes('CREATE_GAME'))).toBe(true);

		const markers = parseTinyPalFixtureMarkers(lines);
		expect(markers.entityId).toBe(TINY_PAL_ENTITY_ID);
		expect(markers.opponentController).toBe(TINY_PAL_OPPONENT_CONTROLLER);
		expect(markers.lastChangeEntityCardId).toBe(CardIds.TinyPal_JAIL_458t4);
		expect(markers.lastChangeEntityLineIndex).toBeGreaterThan(0);
		expect(markers.graveyardLineIndex).toBeGreaterThan(markers.lastChangeEntityLineIndex);
		expect(markers.weaponClearedLineIndex).toBeGreaterThan(0);
	});

	it('reporter log: opponent Board has no Tiny Pal after the weapon breaks', async () => {
		const logPath = resolvePowerLogPathForSlug('tiny-pal');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'tiny-pal-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		expect(ctx.state.opponentDeck.weapon).toBeNull();
		const tinyPalOnBoard = ctx.state.opponentDeck.board.filter((c) => isTinyPalCardId(c.cardId));
		expect(tinyPalOnBoard).toEqual([]);

		ctx.cleanup();
	}, 300_000);
});
