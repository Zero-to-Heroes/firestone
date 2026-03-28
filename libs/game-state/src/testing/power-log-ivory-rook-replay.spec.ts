/**
 * Integration test: replay `test-tools/power-logs/ivory.log` through GameEvents + GameStateService,
 * then validate Ivory Rook discover guess state (armor vs possibleCards costs).
 *
 * Prerequisites: see {@link resolvePowerLogPathForSlug} / `IVORY_POWER_LOG_PATH`, `HS_REFERENCE_CARDS_JSON_PATH`.
 *
 * Run:
 *   npx jest libs/game-state/src/testing/power-log-ivory-rook-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../../../test-tools/lib/trim-power-log-last-game';
import { DeckCard } from '../lib/models/deck-card';
import { extractIvoryRookDiscoverArmorGainFromPowerLogLines } from './ivory-rook-power-log-helpers';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from './power-log-replay-harness';

describe('Power log replay → GameStateService (Ivory Rook cost narrowing)', () => {
	const ivoryRookId = CardIds.IvoryRook_WON_116;

	it('parses armor gained from ivory.log (equals discovered minion cost)', () => {
		const logPath = resolvePowerLogPathForSlug('ivory');
		if (!fs.existsSync(logPath)) {
			return;
		}
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const gain = extractIvoryRookDiscoverArmorGainFromPowerLogLines(logLines);
		expect(gain).toBe(7);
	});

	it(
		'replays ivory.log, parses armor gained from the log, and expects discover possibleCards to match that mana cost',
		async () => {
			const logPath = resolvePowerLogPathForSlug('ivory');
			const cardsPath = resolveCardsJsonPath();
			if (!fs.existsSync(cardsPath) || !fs.existsSync(logPath)) {
				return;
			}
			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const expectedDiscoverCost = extractIvoryRookDiscoverArmorGainFromPowerLogLines(logLines);
			expect(expectedDiscoverCost).toBe(7);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'ivory-power-log-replay',
			});
			if (!ctx) {
				return;
			}

			const ivoryCreated = collectAllDeckCards(ctx.state).filter((c) => c.creatorCardId === ivoryRookId);
			expect(ivoryCreated.length).toBeGreaterThan(0);

			const { allCardsRef } = ctx;
			for (const zoneCard of ivoryCreated) {
				const dc = zoneCard as DeckCard;
				const pool = dc.guessedInfo?.possibleCards ?? [];
				if (pool.length === 0) {
					throw new Error(
						`Ivory Rook discover (entity ${dc.entityId}): guessedInfo.possibleCards is empty after replay; cannot verify all options are ${expectedDiscoverCost}-cost taunts (armor gained from power.log).`,
					);
				}
				const wrongCosts = pool.filter(
					(cardId: string) => (allCardsRef.getCard(cardId)?.cost ?? -1) !== expectedDiscoverCost,
				);
				expect(wrongCosts).toEqual([]);
			}
		},
		120_000,
	);
});
