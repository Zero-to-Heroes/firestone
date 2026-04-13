/**
 * Regression: Kil'jaeden's Portal demons in deck must not expose mana cost or real card ids (info leak).
 *
 * Fixture: `kiljaeden-portal.log` (single-game copy of the reporter log). Override: `POWER_LOG_KILJAEDEN_PORTAL_PATH`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/kiljaeden-portal/power-log-kiljaeden-portal-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Kiljaeden portal deck privacy)', () => {
	it('fixture has PowerTaskList lines where portal entity 92 is CREATOR (shuffle-to-deck sequence)', () => {
		const logPath = resolvePowerLogPathForSlug('kiljaeden-portal');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const n = raw.split(/\r?\n/).filter(
			(l) =>
				l.includes('PowerTaskList.DebugPrintPower()') &&
				l.includes('tag=CREATOR value=92') &&
				!l.includes('GameState.DebugPrintPower()'),
		).length;
		expect(n).toBeGreaterThan(25);
	});

	it(
		'replays kiljaeden-portal.log and hides card id and mana for Kiljaeden portal deck cards',
		async () => {
			const logPath = resolvePowerLogPathForSlug('kiljaeden-portal');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'kiljaeden-portal-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const portalId = CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e;
			const portalDeckCards = ctx.state.playerDeck.deck.filter((c) => c.creatorCardId === portalId);

			expect(portalDeckCards.length).toBeGreaterThan(0);

			for (const c of portalDeckCards) {
				expect(c.cardId).toBeFalsy();
				expect(c.refManaCost == null).toBe(true);
				expect(c.actualManaCost == null).toBe(true);
			}

			// In-game deck shows 30 demons from the portal; one log line may not map to a deck slot at end state.
			expect(portalDeckCards.length).toBe(30);
		},
		180_000,
	);
});
