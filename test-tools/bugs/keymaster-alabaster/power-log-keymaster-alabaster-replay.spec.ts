/**
 * Regression: Keymaster Alabaster copy must flag the opponent's drawn card in their hand.
 *
 * Bug: after opponent draws a hidden card (entity 34) and Keymaster Alabaster (entity 374)
 * adds a copy to the local player's hand (entity 380, Core_UNG_072), the opponent's hand row
 * for entity 34 should show Stonehill Defender.
 *
 * Fixture: test-tools/bugs/keymaster-alabaster/keymaster-alabaster.log (from test-tools/power.log).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/keymaster-alabaster/power-log-keymaster-alabaster-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { DeckCard } from '@firestone/game-state';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	KEYMASTER_ALABASTER_CARD_IDS,
	KEYMASTER_LOCAL_PLAYER_ID,
	parseKeymasterDrawCopyFromLog,
} from './keymaster-alabaster-power-log-helpers';

describe('Power log replay → GameStateService (Keymaster Alabaster opponent hand flag)', () => {
	const slug = 'keymaster-alabaster';

	it('parses Keymaster draw-copy anchors from fixture log', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseKeymasterDrawCopyFromLog(raw.split(/\r?\n/));

		expect(counts.keymasterEntityId).toBe(374);
		expect(counts.opponentDrawnEntityId).toBe(34);
		expect(counts.copyEntityId).toBe(380);
		expect(counts.copyCardId).toBe('Core_UNG_072');
		expect(KEYMASTER_ALABASTER_CARD_IDS).toContain(counts.keymasterCardId);
	});

	it(
		'replays log: opponent hand entity 34 shows Stonehill after Keymaster copy',
		async () => {
			const logPath = resolvePowerLogPathForSlug(slug);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const counts = parseKeymasterDrawCopyFromLog(raw.split(/\r?\n/));

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'keymaster-alabaster-power-log-replay',
				settleMs: 90_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expect(ctx.state.localPlayerId).toBe(KEYMASTER_LOCAL_PLAYER_ID);

			const drawn = ctx.state.opponentDeck.hand.filter(
				(c: DeckCard) => c.entityId === counts.opponentDrawnEntityId,
			);
			expect(drawn.length).toBe(1);
			expect(drawn[0].cardId).toBe(counts.copyCardId);

			const copyInHand = ctx.state.playerDeck.hand.find(
				(c: DeckCard) => c.entityId === counts.copyEntityId,
			);
			expect(copyInHand).toBeDefined();
			expect(copyInHand!.cardId).toBe(counts.copyCardId);
			expect(KEYMASTER_ALABASTER_CARD_IDS).toContain(copyInHand!.creatorCardId as (typeof KEYMASTER_ALABASTER_CARD_IDS)[number]);
		},
		180_000,
	);
});
