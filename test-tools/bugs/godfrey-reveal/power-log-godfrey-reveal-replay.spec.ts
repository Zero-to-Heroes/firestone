/**
 * Regression (Phase 1 — red test): opponent Godfrey-returned hand cards must not leak exact
 * card identity. They should be tagged with Godfrey's Atlas (JAIL_509e) and have empty cardId
 * (UI: "created by Godfrey"), even when burn history copies stamp COPIED_FROM onto return tokens.
 *
 * Fixture: `godfrey-reveal.log` (copy of test-tools/power.log). Local player is reqvam (player 2);
 * opponent (player 1) has Godfrey; overdraw creates SETASIDE return tokens stamped via COPIED_FROM
 * then moved to hand by JAILFX_Godfrey_CardsInHand_OverrideSpawn.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/godfrey-reveal/power-log-godfrey-reveal-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, getDisplayCardIdWhenGuessedPoolIsSingleCard } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	GODFREY_ATLAS_CREATOR,
	parseGodfreyReturnedHandEntityIds,
	parseGodfreyStampPairsForReturnedHand,
} from './godfrey-reveal-power-log-helpers';

describe('Power log replay → GameStateService (Godfrey opponent hand identity leak)', () => {
	const slug = 'godfrey-reveal';
	/** Opponent in this fixture (local is player 2). */
	const opponentPlayer = 1;

	it('fixture: log contains opponent Godfrey returns and COPIED_FROM stamps', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const joined = logLines.join('\n');

		expect(joined).toContain('JAIL_509');
		expect(joined).toContain('JAILFX_Godfrey_CardsInHand_OverrideSpawn');

		const returnedEntityIds = parseGodfreyReturnedHandEntityIds(joined, opponentPlayer);
		expect(returnedEntityIds.length).toBeGreaterThan(0);
		expect(returnedEntityIds).toContain(124);

		const stamps = parseGodfreyStampPairsForReturnedHand(joined, opponentPlayer);
		expect(stamps.length).toBeGreaterThan(0);
		expect(stamps.some((s) => s.returnEntityId === 124 && s.stampedCardId === 'JAIL_514')).toBe(true);
	});

	it(
		'replays godfrey-reveal.log; opponent Godfrey-returned hand cards have no cardId (created by Atlas only)',
		async () => {
			const logPath = resolvePowerLogPathForSlug(slug);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const joined = logLines.join('\n');

			const returnedEntityIds = parseGodfreyReturnedHandEntityIds(joined, opponentPlayer);
			const stamps = parseGodfreyStampPairsForReturnedHand(joined, opponentPlayer);
			expect(returnedEntityIds.length).toBeGreaterThan(0);
			expect(stamps.length).toBeGreaterThan(0);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'godfrey-reveal-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expect(
				ctx.state.opponentDeck.globalEffects.some(
					(c) => c.cardId === CardIds.GodfreytheBetrayer_JAIL_509,
				),
			).toBe(true);

			const stampedStillInHand = stamps.filter((s) =>
				ctx.state.opponentDeck.hand.some((c: DeckCard) => c.entityId === s.returnEntityId),
			);
			expect(stampedStillInHand.length).toBeGreaterThan(0);

			for (const { returnEntityId, stampedCardId } of stampedStillInHand) {
				const card = ctx.state.opponentDeck.hand.find(
					(c: DeckCard) => c.entityId === returnEntityId,
				);
				expect(card).toBeDefined();
				expect(card!.creatorCardId).toBe(GODFREY_ATLAS_CREATOR);
				// Red: today the COPIED_FROM stamp + publicCreator leaks the exact identity.
				expect(card!.cardId == null || card!.cardId === '').toBe(true);
				expect(card!.cardName == null || card!.cardName === '').toBe(true);
				expect(card!.cardId).not.toBe(stampedCardId);
				expect(getDisplayCardIdWhenGuessedPoolIsSingleCard(card!)).toBeNull();
			}
		},
		180_000,
	);
});
