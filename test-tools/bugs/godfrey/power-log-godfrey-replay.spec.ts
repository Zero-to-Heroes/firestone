/**
 * Regression (Phase 1 — red test): Godfrey-returned overdraw cards in opponent hand must be tagged
 * with Godfrey's Atlas (JAIL_509e) and show a guessed pool of burned card ids.
 *
 * Fixture: `godfrey.log` (copy of test-tools/power.log). Local player is Chmielinho (player 1);
 * opponent has Godfrey; overdraw burns JAIL_312 / JAIL_720, then returns SETASIDE tokens 136/137 to hand.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/godfrey/power-log-godfrey-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	parseGodfreyBurnedCards,
	parseGodfreyReturnedHandEntityIds,
} from './godfrey-power-log-helpers';

describe('Power log replay → GameStateService (Godfrey returned cards pool)', () => {
	const slug = 'godfrey';

	it('fixture: log contains Godfrey overdraw burn and hand return markers', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const joined = logLines.join('\n');

		expect(joined).toContain('JAIL_509');
		expect(joined).toContain('BURNED_CARD');
		expect(joined).toContain('JAILFX_Godfrey_CardsInHand_OverrideSpawn');

		const burned = parseGodfreyBurnedCards(joined);
		expect(burned.length).toBe(2);
		expect(burned.map((c) => c.cardId).sort()).toEqual(['JAIL_312', 'JAIL_720']);

		const returnedEntityIds = parseGodfreyReturnedHandEntityIds(joined);
		expect(returnedEntityIds).toEqual([136, 137]);
	});

	it(
		'replays godfrey.log; opponent Godfrey-returned hand cards are tagged JAIL_509e with burned-card pool',
		async () => {
			const logPath = resolvePowerLogPathForSlug(slug);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const joined = logLines.join('\n');

			const burnedFromLog = parseGodfreyBurnedCards(joined);
			const burnedCardIds = burnedFromLog.map((c) => c.cardId);
			const returnedEntityIds = parseGodfreyReturnedHandEntityIds(joined);
			expect(burnedCardIds.length).toBeGreaterThan(0);
			expect(returnedEntityIds.length).toBeGreaterThan(0);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'godfrey-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expect(
				ctx.state.opponentDeck.globalEffects.some(
					(c) => c.cardId === CardIds.GodfreytheBetrayer_JAIL_509,
				),
			).toBe(true);

			const burnedInState = ctx.state.opponentDeck.burnedCards.map((c) => c.cardId);
			for (const cardId of burnedCardIds) {
				expect(burnedInState).toContain(cardId);
			}

			const godfreyReturned = ctx.state.opponentDeck.hand.filter(
				(c: DeckCard) =>
					c.entityId != null &&
					returnedEntityIds.includes(c.entityId) &&
					!c.cardId?.length,
			);
			expect(godfreyReturned.length).toBe(returnedEntityIds.length);

			for (const card of godfreyReturned) {
				expect(card.creatorCardId).toBe(GODFREY_ATLAS_CREATOR);
				expect(getDisplayCardIdWhenGuessedPoolIsSingleCard(card)).toBeNull();
				const pool = card.guessedInfo?.possibleCards ?? [];
				expect(pool.length).toBe(burnedCardIds.length);
				expect(pool.sort()).toEqual([...burnedCardIds].sort());
				const wrongPool = pool.filter((id) => !burnedCardIds.includes(id));
				expect(wrongPool).toEqual([]);
			}
		},
		180_000,
	);
});
