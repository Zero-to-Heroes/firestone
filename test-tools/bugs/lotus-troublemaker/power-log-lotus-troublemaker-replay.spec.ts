/**
 * Cultist Map second pick: opponent must not reveal Lotus Troublemaker (JAIL_470) in hand.
 * Discover options are UNKNOWN ENTITY for the local player; only a SETASIDE preview is SHOW_ENTITY'd.
 *
 * Fixture: `lotus-troublemaker.log` (copy of test-tools/power.log). Local player is 1;
 * opponent (player 2) plays Cultist Map, then the enchant second pick draws entity 39.
 * SHOW_ENTITY id=104 CardID=JAIL_470, COPIED_FROM_ENTITY_ID=39, LINKED_ENTITY=39.
 * Entity 39 stays in HAND at end of log.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/lotus-troublemaker/power-log-lotus-troublemaker-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	DeckCard,
	getDisplayCardIdWhenGuessedPoolIsSingleCard,
	mergeHandCardsForDeckTrackerDisplay,
} from '@firestone/game-state';
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
	logDrawsSourceToHandWithoutCardId,
	LOTUS_TROUBLEMAKER_CARD_ID,
	parseLotusTroublemakerLeakAnchors,
} from './lotus-troublemaker-power-log-helpers';

describe('Power log replay → Cultist Map Lotus Troublemaker (no opponent hand identity leak)', () => {
	const slug = 'lotus-troublemaker';

	it('fixture: log contains SETASIDE SHOW_ENTITY JAIL_470 linked to a hidden DECK→HAND draw', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const joined = logLines.join('\n');

		expect(joined).toContain('TLC_515');
		expect(joined).toContain(`CardID=${LOTUS_TROUBLEMAKER_CARD_ID}`);

		const anchors = parseLotusTroublemakerLeakAnchors(joined);
		expect(anchors).not.toBeNull();
		expect(anchors!.previewEntityId).toBe(104);
		expect(anchors!.sourceEntityId).toBe(39);
		expect(logDrawsSourceToHandWithoutCardId(joined, anchors!.sourceEntityId)).toBe(true);
	});

	it('replays lotus-troublemaker.log: opponent hand must not expose JAIL_470 on Cultist Map draw', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const joined = logLines.join('\n');

		const anchors = parseLotusTroublemakerLeakAnchors(joined);
		expect(anchors).not.toBeNull();
		const sourceEntityId = anchors!.sourceEntityId;

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'lotus-troublemaker-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const leakedId = CardIds.LotusTroublemaker_JAIL_470;
		const slot = ctx.state.opponentDeck.hand.find((c: DeckCard) => c.entityId === sourceEntityId);
		expect(slot).toBeDefined();
		expect(slot!.cardId).not.toBe(leakedId);
		expect(getDisplayCardIdWhenGuessedPoolIsSingleCard(slot!)).not.toBe(leakedId);
		expect(ctx.state.opponentDeck.additionalKnownCardsInHand).not.toContain(leakedId);

		const displayedHand = mergeHandCardsForDeckTrackerDisplay(
			ctx.state.opponentDeck.hand,
			ctx.state.opponentDeck.additionalKnownCardsInHand,
			ctx.allCardsRef,
		);
		expect(displayedHand.some((c) => c.cardId === leakedId)).toBe(false);
	}, 180_000);
});
