/**
 * Regression: opponent Moonlit Guidance discover-from-deck must flag the drawn original in hand
 * and remove it from the opponent deck list.
 *
 * Bug: after opponent plays Moonlit Guidance, discovers Zephrys (ULD_003), plays the copy, and
 * draws the original (entity 48), the tracker should show Zephrys in opponent hand and remove
 * it from opponent "In deck".
 *
 * Fixture: support power.log — Chmielinho#2928 (P1) vs ПапаОрешник#2254 (P2). Moonlit discover
 * picks entity 150; COPIED_FROM_ENTITY_ID=48; DED_002e draws entity 48 DECK→HAND as ULD_003.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/moonlit-guidance/power-log-moonlit-guidance-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	MOONLIT_GUIDANCE_CARD_IDS,
	MOONLIT_OPPONENT_PLAYER_ID,
	parseMoonlitGuidanceFixtureCounts,
} from './moonlit-guidance-power-log-helpers';

describe('Power log replay → GameStateService (Moonlit Guidance discover-from-deck)', () => {
	it('parses Moonlit Guidance discover pick from fixture log', () => {
		const logPath = resolvePowerLogPathForSlug('moonlit-guidance');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseMoonlitGuidanceFixtureCounts(raw.split(/\r?\n/));

		expect(counts.opponentPlayerId).toBe(MOONLIT_OPPONENT_PLAYER_ID);
		expect(counts.discoverChoiceId).toBe(4);
		expect(counts.pickedCopyEntityId).toBe(150);
		expect(counts.sourceDeckEntityId).toBe(48);
		expect(counts.pickedCardId).toBe(CardIds.ZephrysTheGreat_ULD_003);
		expect(counts.originalDrawnEntityId).toBe(48);
		expect(counts.discoverOptionEntityIds).toEqual([149, 150, 148]);
		expect(MOONLIT_GUIDANCE_CARD_IDS).toContain(CardIds.MoonlitGuidance_DED_002);
		expect(MOONLIT_GUIDANCE_CARD_IDS).toContain(CardIds.MoonlitGuidance_PathOfTheMoonEnchantment);
	});

	it('replays moonlit-guidance.log: opponent hand shows Zephrys after original draw; deck row removed', async () => {
		const logPath = resolvePowerLogPathForSlug('moonlit-guidance');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseMoonlitGuidanceFixtureCounts(raw.split(/\r?\n/));

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'moonlit-guidance-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		expect(ctx.state.localPlayerId).not.toBe(MOONLIT_OPPONENT_PLAYER_ID);

		const drawnOriginal = ctx.state.opponentDeck.hand.filter(
			(c) => c.entityId === counts.originalDrawnEntityId,
		);
		expect(drawnOriginal.length).toBe(1);
		expect(drawnOriginal[0].cardId).toBe(counts.pickedCardId);

		const stillInDeck = ctx.state.opponentDeck.deck.filter(
			(c) => c.entityId === counts.sourceDeckEntityId || c.cardId === counts.pickedCardId,
		);
		expect(stillInDeck).toEqual([]);
	}, 180_000);
});
