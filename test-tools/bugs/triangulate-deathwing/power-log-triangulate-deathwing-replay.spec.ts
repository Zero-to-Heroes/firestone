/**
 * Regression (Phase 1 — red test): After Triangulate chooses a spell, copies shuffled into the deck must
 * keep creator Triangulate (GDB_451) and the chosen spell cardId — not "Created by Deathwing".
 *
 * Fixture: `triangulate-deathwing.log` — last game from support power.zip, truncated after Triangulate’s
 * SpawnToDeck subspell (entities 160–162) so those copies stay in deck for final-state assertions.
 * Deathwing hero applies `ReuseFX_Generic_SpawnToDeck_NoFX_CardFromScript_Super` with Source=hero (HERO_02bx),
 * which currently overwrites creator in CREATE_CARD_IN_DECK and breaks Triangulate prediction.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/triangulate-deathwing/power-log-triangulate-deathwing-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
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

const TRIANGULATE_CREATOR = CardIds.Triangulate_GDB_451;

/** Deck entity ids created empty then shuffled (GameState around SUB_SPELL_START SpawnToDeck / Deathwing source). */
const SHUFFLED_COPY_ENTITY_IDS = [160, 161, 162] as const;

function parseChosenSpellCardIdFromTriangulateDiscover(raw: string): string | null {
	const lines = raw.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (!line.includes('Source=[entityName=Triangulate') || !line.includes('GDB_451')) {
			continue;
		}
		for (let j = i; j < Math.min(i + 30, lines.length); j++) {
			const m = lines[j]!.match(/m_chosenEntities\[0\]=\[[^\]]*cardId=(\w+)/);
			if (m) {
				return m[1] ?? null;
			}
		}
		break;
	}
	return null;
}

describe('Power log replay → Triangulate + Deathwing deck copies', () => {
	it('fixture: last game, Triangulate play, SpawnToDeck subspell sourced from Deathwing hero', () => {
		const logPath = resolvePowerLogPathForSlug('triangulate-deathwing');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(lines[0]?.includes('CREATE_GAME')).toBe(true);
		const joined = lines.join('\n');
		expect(joined).toMatch(/BLOCK_START BlockType=PLAY.*GDB_451/);
		expect(joined).toContain('ReuseFX_Generic_SpawnToDeck_NoFX_CardFromScript_Super');
		// Log uses "Source = [entityName=Deathwing..." (spaces around "=")
		expect(joined).toMatch(
			/Source\s*=\s*\[entityName=Deathwing id=\d+ zone=PLAY[^\]]*cardId=HERO_02bx/,
		);
		const expectedSpell = parseChosenSpellCardIdFromTriangulateDiscover(joined);
		expect(expectedSpell).toBeTruthy();
	});

	it(
		'replays log; deck copies from Triangulate shuffle have Triangulate creator and chosen spell cardId',
		async () => {
			const logPath = resolvePowerLogPathForSlug('triangulate-deathwing');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const expectedSpellCardId = parseChosenSpellCardIdFromTriangulateDiscover(
				trimPowerLogLinesToLastGame(raw.split(/\r?\n/)).join('\n'),
			);
			expect(expectedSpellCardId).toBeTruthy();

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'triangulate-deathwing-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const playerDeckCards = collectAllDeckCards(ctx.state).filter((c) =>
				SHUFFLED_COPY_ENTITY_IDS.includes(c.entityId as (typeof SHUFFLED_COPY_ENTITY_IDS)[number]),
			);
			expect(playerDeckCards.length).toBe(SHUFFLED_COPY_ENTITY_IDS.length);

			for (const c of playerDeckCards) {
				expect(c.creatorCardId).toBe(TRIANGULATE_CREATOR);
				expect(c.cardId).toBe(expectedSpellCardId);
			}
		},
		180_000,
	);
});
