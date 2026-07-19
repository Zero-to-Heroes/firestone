/**
 * Regression: opponent Commander Geddon Barren discover-from-deck must not leak the chosen
 * card into opponentDeck.deck; the pick should appear as a hidden tutor draw in hand.
 *
 * Bug (reporter vs Logtube#21387): after opponent discovers from deck via Geddon, the picked
 * card (Murozond / TIME_024) showed under "In deck" with full identity instead of in hand as
 * unknown "Last affected by Commander Geddon". On draw, a filler row was removed instead of
 * the discovered card row.
 *
 * In-game the local player must not see which card was discovered; the power.log does reveal
 * TIME_024 when entity 118 is chosen — the tracker must not surface that cardId on the deck list.
 *
 * Fixture: support power.log — Logtube (P1) vs Theo#2868 (P2), warrior Geddon game. Extracted
 * from CREATE_GAME at 21:32:24 through first Barren discover resolution (choice id=7: SETASIDE
 * entity 118 → deck entity 20 TIME_024 to HAND; END_020 and TLC_606 incinerated). Truncated
 * at line 213443 (MAIN_END after discover) before further plays.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/geddon-discover/power-log-geddon-discover-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	GEDDON_DISCOVER_SOURCE_CARD_IDS,
	GEDDON_OPPONENT_PLAYER_ID,
	parseGeddonDiscoverFixtureCounts,
} from './geddon-discover-power-log-helpers';

describe('Power log replay → GameStateService (Commander Geddon discover-from-deck)', () => {
	const geddonSources = [CardIds.CommanderGeddon_CATA_591, CardIds.CommanderGeddon_BarrenEnchantment_CATA_591e];

	it('parses Geddon discover pick from fixture log', () => {
		const logPath = resolvePowerLogPathForSlug('geddon-discover');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseGeddonDiscoverFixtureCounts(raw.split(/\r?\n/));

		expect(counts.opponentPlayerId).toBe(GEDDON_OPPONENT_PLAYER_ID);
		expect(counts.discoverChoiceId).toBe(7);
		expect(counts.pickedSetAsideEntityId).toBe(118);
		expect(counts.pickedDeckEntityId).toBe(20);
		expect(counts.pickedCardId).toBe('TIME_024');
		expect(counts.discoverOptionEntityIds).toEqual([119, 120, 118]);
		expect(GEDDON_DISCOVER_SOURCE_CARD_IDS).toContain(CardIds.CommanderGeddon_BarrenEnchantment_CATA_591e);
	});

	it('replays geddon-discover.log: opponent deck must not leak discovered pick; hand is tutor-hidden', async () => {
		const logPath = resolvePowerLogPathForSlug('geddon-discover');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseGeddonDiscoverFixtureCounts(raw.split(/\r?\n/));

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'geddon-discover-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		expect(ctx.state.localPlayerId).not.toBe(GEDDON_OPPONENT_PLAYER_ID);

		const leakedInDeck = ctx.state.opponentDeck.deck.filter((c) => c.cardId === counts.pickedCardId);
		expect(leakedInDeck).toEqual([]);

		const tutorHandCards = ctx.state.opponentDeck.hand.filter(
			(c) => !c.cardId?.length && geddonSources.includes(c.lastAffectedByCardId as CardIds),
		);
		expect(tutorHandCards.length).toBeGreaterThan(0);
	}, 180_000);
});
