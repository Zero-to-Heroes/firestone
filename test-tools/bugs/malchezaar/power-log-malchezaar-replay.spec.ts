/**

 * Regression: when the opponent draws a card created by Prince Malchezaar (KAR_096),

 * the matching row must leave opponentDeck.deck. Pre-fix the tracker keeps the full

 * "Created by Prince Malchezaar" count (20 instead of 19 after one draw).

 *

 * Fixture: reporter power.log — trimmed to last game, truncated after the opponent draws

 * Malchezaar legendary entity 80 (DECK → HAND, turn 1). Malchezaar is on the opponent

 * (power.log player 1); local player is player 2.

 *

 * Run:

 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json

 *   npx jest test-tools/bugs/malchezaar/power-log-malchezaar-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand

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
	MALCHEZAAR_CREATOR_CARD_ID,
	MALCHEZAAR_OPPONENT_PLAYER_ID,
	parseMalchezaarDeckFixtureCounts,
} from './malchezaar-power-log-helpers';

describe('Power log replay → GameStateService (Prince Malchezaar created-in-deck removal)', () => {
	const malchezaarCreator = CardIds.PrinceMalchezaar_KAR_096;

	it('parses Malchezaar created/drawn counts from fixture log', () => {
		const logPath = resolvePowerLogPathForSlug('malchezaar');

		requirePowerLogFixtureExists(logPath);

		const raw = fs.readFileSync(logPath, 'utf8');

		const counts = parseMalchezaarDeckFixtureCounts(raw.split(/\r?\n/));

		expect(counts.malchezaarSetAsideEntityIds.length).toBeGreaterThan(0);

		expect(counts.createdInDeckEntityIds.length).toBe(20);

		expect(counts.drawnFromDeckEntityIds).toEqual([80]);

		expect(counts.expectedRemainingInDeck).toBe(19);

		expect(MALCHEZAAR_CREATOR_CARD_ID).toBe(malchezaarCreator);
	});

	it('replays malchezaar.log: opponent Malchezaar deck count drops when entity 80 is drawn', async () => {
		const logPath = resolvePowerLogPathForSlug('malchezaar');

		const cardsPath = resolveCardsJsonPath();

		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const raw = fs.readFileSync(logPath, 'utf8');

		const counts = parseMalchezaarDeckFixtureCounts(raw.split(/\r?\n/));

		expect(counts.expectedRemainingInDeck).toBe(19);

		expect(counts.drawnFromDeckEntityIds).toEqual([80]);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'malchezaar-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		// Malchezaar is on the opponent, not the local player.

		expect(ctx.state.localPlayerId).not.toBe(MALCHEZAAR_OPPONENT_PLAYER_ID);

		const malchezaarInOpponentDeck = ctx.state.opponentDeck.deck.filter(
			(c) => c.creatorCardId === malchezaarCreator,
		);

		expect(malchezaarInOpponentDeck.length).toBe(counts.expectedRemainingInDeck);
	}, 120_000);
});
