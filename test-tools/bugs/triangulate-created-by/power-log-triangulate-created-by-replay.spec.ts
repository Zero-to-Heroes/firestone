/**
 * Regression (Phase 1 — red test): Opponent plays Triangulate, draws the discovered spell, shuffles 3
 * copies into deck. After they play that spell (Ancestral Knowledge), deck copies must show that spell
 * with creator Triangulate — not unknown cards or a wrong "created by" hero source.
 *
 * Fixture: `triangulate-created-by.log` (copy of test-tools/power.log). Opponent Triangulate (entity 48),
 * discovers AT_053, draws entity 42, SpawnToDeck copies 85–87 (DISPLAYED_CREATOR=48) via Thrall hero
 * subspell `ReuseFX_Generic_SpawnToDeck_NoFX_CardFromScript_Super`, then plays AT_053.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/triangulate-created-by/power-log-triangulate-created-by-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import * as fs from 'fs';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';

const TRIANGULATE_CREATOR = CardIds.Triangulate_GDB_451;
const CHOSEN_SPELL = CardIds.AncestralKnowledge;

/** Deck entity ids after Triangulate SpawnToDeck (DISPLAYED_CREATOR=48). */
const SHUFFLED_COPY_ENTITY_IDS = [85, 86, 87] as const;

/**
 * After Triangulate discover (Source id=48), read chosen entity id then first SHOW_ENTITY CardID for it.
 */
function parseChosenSpellCardIdFromTriangulateDiscover(raw: string): string | null {
	const marker = 'Source=[entityName=Triangulate id=48 zone=PLAY zonePos=0 cardId=GDB_451 player=2]';
	const idx = raw.indexOf(marker);
	if (idx < 0) {
		return null;
	}
	const tail = raw.slice(idx);
	const chosen =
		tail.match(
			/DebugPrintEntitiesChosen\(\)[\s\S]*?Entities\[0\]=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+)/,
		) ??
		tail.match(/Entities\[0\]=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+)/);
	const eid = chosen?.[1];
	if (!eid) {
		return null;
	}
	const re = new RegExp(
		`SHOW_ENTITY - Updating Entity=\\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${eid}[^\\n]*CardID=(\\w+)`,
	);
	const show = tail.match(re);
	return show?.[1] ?? null;
}

describe('Power log replay → opponent Triangulate + Thrall SpawnToDeck deck copies', () => {
	it('fixture: last game, Triangulate play, discover AT_053, opponent plays drawn spell', () => {
		const logPath = resolvePowerLogPathForSlug('triangulate-created-by');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(lines[0]?.includes('CREATE_GAME')).toBe(true);
		const joined = lines.join('\n');
		expect(joined).toMatch(/BLOCK_START BlockType=PLAY[\s\S]*?CardID=GDB_451/);
		expect(joined).toContain('ReuseFX_Generic_SpawnToDeck_NoFX_CardFromScript_Super');
		expect(joined).toMatch(/Source\s*=\s*\[entityName=Thrall id=\d+ zone=PLAY[^\]]*cardId=HERO_02/);
		expect(parseChosenSpellCardIdFromTriangulateDiscover(joined)).toBe(CHOSEN_SPELL);
		// Drawn copy is entity 42 (hidden in hand); PLAY reveals AT_053 on SHOW_ENTITY, then names the card.
		expect(joined).toMatch(
			/SHOW_ENTITY - Updating Entity=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=42[^\n]*CardID=AT_053/,
		);
		expect(joined).toMatch(/entityName=Ancestral Knowledge id=42[^\]]*cardId=AT_053/);
	});

	it(
		'replays log; after opponent plays discovered spell, Triangulate deck copies are that spell',
		async () => {
			const logPath = resolvePowerLogPathForSlug('triangulate-created-by');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const expectedSpellCardId = parseChosenSpellCardIdFromTriangulateDiscover(
				trimPowerLogLinesToLastGame(raw.split(/\r?\n/)).join('\n'),
			);
			expect(expectedSpellCardId).toBe(CHOSEN_SPELL);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'triangulate-created-by-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const deckEntityId = (c: DeckCard) => c.entityId ?? c.trueEntityId;
			const shuffledCopyCards = collectAllDeckCards(ctx.state).filter((c) =>
				SHUFFLED_COPY_ENTITY_IDS.includes(deckEntityId(c) as (typeof SHUFFLED_COPY_ENTITY_IDS)[number]),
			);
			expect(shuffledCopyCards.length).toBe(SHUFFLED_COPY_ENTITY_IDS.length);

			for (const c of shuffledCopyCards) {
				expect(c.creatorCardId).toBe(TRIANGULATE_CREATOR);
				expect(c.cardId).toBe(expectedSpellCardId);
			}
		},
		180_000,
	);
});
