/**
 * Cultist Map second pick after Psychic Conjurer revealed Chrono-Lord Epoch in opponent deck:
 * dredged entity 189 must leave opponentDeck.deck when drawn to hand (no duplicate TIME_714 row).
 *
 * Fixture truncated through PowerTaskList 1649 end (~line 55321): entity 189 in opponent HAND,
 * before PLAY at line 55330.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/epoch-dredge/power-log-epoch-dredge-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { DeckCard } from '@firestone/game-state';
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
	assertCultistMapDredgeAnchorsFromPowerLogLines,
	DREDGED_DECK_ENTITY_ID,
	REVEALED_CARD_ID,
} from './epoch-dredge-power-log-helpers';

describe('Power log replay → Cultist Map dredge (epoch-dredge, no duplicate deck row)', () => {
	it('fixture contains Cultist Map dredge anchors for entity 189 / TIME_714', () => {
		const logPath = resolvePowerLogPathForSlug('epoch-dredge');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		assertCultistMapDredgeAnchorsFromPowerLogLines(logLines);
	});

	it(
		'replays epoch-dredge.log: opponent deck must not retain TIME_714 after entity 189 dredge draw',
		async () => {
			const logPath = resolvePowerLogPathForSlug('epoch-dredge');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'epoch-dredge-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const opponentDeckRows = ctx.state.opponentDeck.deck;
			expect(opponentDeckRows.filter((c) => c.cardId === REVEALED_CARD_ID)).toEqual([]);
			expect(opponentDeckRows.filter((c) => c.entityId === DREDGED_DECK_ENTITY_ID)).toEqual([]);

			const inHand = ctx.state.opponentDeck.hand.some(
				(c) => (c as DeckCard).entityId === DREDGED_DECK_ENTITY_ID,
			);
			expect(inHand).toBe(true);
		},
		180_000,
	);
});
