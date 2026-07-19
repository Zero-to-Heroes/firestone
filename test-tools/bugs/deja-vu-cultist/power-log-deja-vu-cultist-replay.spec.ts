/**
 * Cultist Map first pick + Deja Vu: opponent deck must not keep Deja Vu (TIME_039) at positionFromTop
 * or mis-label the next draw (entity 57) as Deja Vu.
 *
 * Fixture truncated through opponent turn-6 start draw (~line 4360): entity 57 in HAND, log later reveals CATA_785.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/deja-vu-cultist/power-log-deja-vu-cultist-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	assertCultistDejaVuAnchorsFromPowerLogLines,
	CULTIST_FIRST_PICK_DECK_ENTITY,
	DEJA_VU_CARD_ID,
	DEJA_VU_PLAY_ENTITY,
	NEXT_DRAW_ENTITY,
} from './deja-vu-cultist-power-log-helpers';

describe('Power log replay → Cultist Map + Deja Vu (no sticky Deja Vu topdeck)', () => {
	it('fixture contains Cultist Map / Deja Vu / turn-6 draw anchors', () => {
		const logPath = resolvePowerLogPathForSlug('deja-vu-cultist');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		assertCultistDejaVuAnchorsFromPowerLogLines(logLines);
	});

	it(
		'replays deja-vu-cultist.log: opponent deck must not retain TIME_039 on top; entity 57 draw not Deja Vu',
		async () => {
			const logPath = resolvePowerLogPathForSlug('deja-vu-cultist');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'deja-vu-cultist-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const opponentDeck = ctx.state.opponentDeck.deck;
			const topSlots = opponentDeck.filter((c) => c.positionFromTop != null);
			const dejaOnTop = topSlots.filter((c) => c.cardId === DEJA_VU_CARD_ID);
			expect(dejaOnTop).toEqual([]);

			// Cultist Map first pick must remove the dredge-marked deck row (entity 55); stale
			// positionFromTop rows cause wrong top-of-deck identification (reported as Deja Vu stuck on top).
			expect(topSlots).toEqual([]);

			expect(opponentDeck.filter((c) => c.cardId === DEJA_VU_CARD_ID)).toEqual([]);

			expect(opponentDeck.filter((c) => c.entityId === CULTIST_FIRST_PICK_DECK_ENTITY)).toEqual([]);

			const drawn = ctx.state.opponentDeck.hand.find(
				(c) => (c as DeckCard).entityId === NEXT_DRAW_ENTITY,
			) as DeckCard | undefined;
			expect(drawn?.cardId).not.toBe(DEJA_VU_CARD_ID);

			const dejaInHand = ctx.state.opponentDeck.hand.filter((c) => c.cardId === DEJA_VU_CARD_ID);
			const playedDeja = dejaInHand.filter((c) => c.entityId === DEJA_VU_PLAY_ENTITY);
			expect(playedDeja).toEqual([]);
		},
		180_000,
	);
});
