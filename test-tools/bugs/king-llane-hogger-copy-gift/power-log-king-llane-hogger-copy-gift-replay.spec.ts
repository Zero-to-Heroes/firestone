/**
 * Regression: After COPIED_FROM_ENTITY_ID on entity 70 (Hogger's King Llane duplicate),
 * opponent-deck entity 69 (King Llane that hid into the enemy deck from local SoG) must keep
 * creatorCardId TIME_875t so it stays a gift / not treated as an initial-deck card.
 *
 * Local player in the fixture is Chmielinho (PlayerId 2, Garona package). Entity 69 is created
 * into HattriK's deck (opponent from local view) with opaque entityId + trueEntityId=69.
 *
 * Bug trigger: `copied-from-entity-id-parser.ts` misses the gift via public entityId, then
 * linkCopiedCardIntoDeck replaces it with a creator-less row.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/king-llane-hogger-copy-gift/power-log-king-llane-hogger-copy-gift-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	HOGGER_CARD_ID,
	HOGGER_COPY_ENTITY_ID,
	HOGGER_CREATOR_ENTITY_ID,
	KING_LLANE_CARD_ID,
	KING_LLANE_HOGGER_COPY_GIFT_POWER_LOG_PATH,
	parseKingLlaneHoggerCopyGiftFixtureMarkers,
	PLAYER_HIDDEN_KING_LLANE_ENTITY_ID,
} from './king-llane-hogger-copy-gift-power-log-helpers';

const findDeckRowByEntity = (deck: readonly DeckCard[], entityId: number): DeckCard | undefined =>
	deck.find((c) => (c.entityId ?? c.trueEntityId) === entityId);

describe('Power log replay → King Llane gift creator after Hogger COPIED_FROM', () => {
	it('fixture: king-llane-hogger-copy-gift.log contains Hogger copy of entity 69 as TIME_875t', () => {
		const logPath = resolvePowerLogPathForSlug('king-llane-hogger-copy-gift');
		expect(logPath).toBe(KING_LLANE_HOGGER_COPY_GIFT_POWER_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
		expect(lines.some((line) => line.includes('CREATE_GAME'))).toBe(true);

		const markers = parseKingLlaneHoggerCopyGiftFixtureMarkers(lines);
		expect(markers.hoggerCreatesCopyLineIndex).toBeGreaterThan(0);
		expect(markers.hoggerCopyShowEntityLineIndex).toBeGreaterThan(markers.hoggerCreatesCopyLineIndex);
		expect(markers.hoggerCopyCopiedFromLineIndex).toBeGreaterThan(markers.hoggerCopyShowEntityLineIndex);
		expect(lines[markers.hoggerCopyCopiedFromLineIndex]).toContain(
			`COPIED_FROM_ENTITY_ID value=${PLAYER_HIDDEN_KING_LLANE_ENTITY_ID}`,
		);
		expect(lines[markers.hoggerCopyCreatorLineIndex]).toContain(`CREATOR value=${HOGGER_CREATOR_ENTITY_ID}`);
	});

	it(
		'replays log; opponent deck entity 69 keeps TIME_875t creator after COPIED_FROM for entity 70',
		async () => {
			const logPath = resolvePowerLogPathForSlug('king-llane-hogger-copy-gift');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'king-llane-hogger-copy-gift-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			// Entity 69 lives on the opponent deck (opaque gift from local King Llane SoG).
			const hiddenKingLlane = findDeckRowByEntity(
				ctx.state.opponentDeck.deck,
				PLAYER_HIDDEN_KING_LLANE_ENTITY_ID,
			);
			expect(hiddenKingLlane).toBeDefined();
			expect(hiddenKingLlane!.cardId).toBe(KING_LLANE_CARD_ID);
			// Gift from local King Llane SoG — must not be treated as initial-deck.
			expect(hiddenKingLlane!.creatorCardId).toBe(KING_LLANE_CARD_ID);

			const hoggerCopy = findDeckRowByEntity(ctx.state.opponentDeck.deck, HOGGER_COPY_ENTITY_ID);
			expect(hoggerCopy).toBeDefined();
			expect(hoggerCopy!.cardId).toBe(KING_LLANE_CARD_ID);
			expect(hoggerCopy!.creatorCardId).toBe(HOGGER_CARD_ID);

			ctx.cleanup();
		},
		300_000,
	);
});
