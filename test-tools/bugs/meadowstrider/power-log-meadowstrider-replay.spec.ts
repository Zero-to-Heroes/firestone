/**
 * Regression: Meadowstrider deathrattle puts a copy (EDR_978) on the bottom of the deck;
 * DeckCard.positionFromBottom must be set so the UI can show it under "Bottom of deck".
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/meadowstrider/power-log-meadowstrider-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

/** Entity id of the deck copy from meadowstrider.log (SHOW_ENTITY … id=275 … ZONE=DECK … EDR_978). */
const MEADOWSTRIDER_DECK_COPY_ENTITY_ID = 275;

describe('Power log replay → GameStateService (Meadowstrider bottom of deck)', () => {
	it('parses deck-copy entity id from fixture (sanity)', () => {
		const logPath = resolvePowerLogPathForSlug('meadowstrider');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const deckShow = lines.find(
			(l) =>
				l.includes('SHOW_ENTITY') &&
				l.includes('zone=DECK') &&
				l.includes('CardID=EDR_978') &&
				l.includes(`id=${MEADOWSTRIDER_DECK_COPY_ENTITY_ID}`),
		);
		expect(deckShow).toBeTruthy();
	});

	it(
		'replays meadowstrider.log: deck copy of Meadowstrider has positionFromBottom set',
		async () => {
			const logPath = resolvePowerLogPathForSlug('meadowstrider');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'meadowstrider-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const all = collectAllDeckCards(ctx.state);
			const copy = all.find(
				(c) =>
					(c.entityId ?? c.trueEntityId) === MEADOWSTRIDER_DECK_COPY_ENTITY_ID &&
					c.cardId === CardIds.Meadowstrider_EDR_978,
			) as DeckCard | undefined;
			expect(copy).toBeTruthy();
			expect(copy!.positionFromBottom).not.toBeNull();
			expect(copy!.positionFromBottom).not.toBeUndefined();
		},
		120_000,
	);
});
