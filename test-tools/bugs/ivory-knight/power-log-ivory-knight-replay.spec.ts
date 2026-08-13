/**
 * Integration test: replay `ivory-knight.log` through GameEvents + GameStateService,
 * then validate Ivory Knight discover guess state (heal vs possibleCards costs).
 *
 * Ivory Knight: Battlecry: Discover a spell. Restore Health to your hero equal to its Cost.
 * This fixture: opponent (player 2) discovers entity 140; heal is 5; hero still has DAMAGE=1
 * so the unknown spell costs exactly 5 (heal was not capped by full health).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/ivory-knight/power-log-ivory-knight-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
import { extractIvoryKnightDiscoverHealFromPowerLogLines } from './ivory-knight-power-log-helpers';

const IVORY_KNIGHT_IDS: readonly string[] = [
	CardIds.IvoryKnight,
	CardIds.IvoryKnight_WON_045,
	CardIds.IvoryKnight_CORE_KAR_057,
];

describe('Power log replay → GameStateService (Ivory Knight cost narrowing after heal)', () => {
	const slug = 'ivory-knight';

	it('parses heal amount and post-heal hero DAMAGE from ivory-knight.log', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const heal = extractIvoryKnightDiscoverHealFromPowerLogLines(logLines);
		expect(heal).not.toBeNull();
		expect(heal!.healAmount).toBe(5);
		expect(heal!.postHealHeroDamage).toBe(1);
	});

	it('replays ivory-knight.log and expects discover possibleCards to be exactly the heal-amount cost (hero not at full health)', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const heal = extractIvoryKnightDiscoverHealFromPowerLogLines(logLines);
		expect(heal).not.toBeNull();
		expect(heal!.healAmount).toBe(5);
		expect(heal!.postHealHeroDamage).toBeGreaterThan(0);

		const expectedDiscoverCost = heal!.healAmount;

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'ivory-knight-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const ivoryCreated = collectAllDeckCards(ctx.state).filter(
			(c) => IVORY_KNIGHT_IDS.includes(c.creatorCardId ?? '') && !c.cardId?.length,
		);
		expect(ivoryCreated.length).toBeGreaterThan(0);

		const { allCardsRef } = ctx;
		for (const zoneCard of ivoryCreated) {
			const dc = zoneCard as DeckCard;
			const pool = dc.guessedInfo?.possibleCards ?? [];
			if (pool.length === 0) {
				throw new Error(
					`Ivory Knight discover (entity ${dc.entityId}): guessedInfo.possibleCards is empty after replay; cannot verify all options are ${expectedDiscoverCost}-cost spells (heal from power.log, hero still damaged).`,
				);
			}
			const wrongCosts = pool.filter(
				(cardId: string) => (allCardsRef.getCard(cardId)?.cost ?? -1) !== expectedDiscoverCost,
			);
			expect(wrongCosts).toEqual([]);
		}
	}, 120_000);
});
