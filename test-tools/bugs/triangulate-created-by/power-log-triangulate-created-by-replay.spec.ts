/**
 * Regression (Phase 1 — red test): After Triangulate chooses a spell, deck copies from SpawnToDeck must keep
 * creator Triangulate (GDB_451) and the chosen spell cardId — not a wrong "created by" hero source.
 *
 * Fixture: `triangulate-created-by.log` — last game from support power.zip, truncated after the PowerTaskList
 * SpawnToDeck subspell (entities 182–184) so copies remain in deck for assertions. Valeera hero (HERO_03g) applies
 * `ReuseFX_Generic_SpawnToDeck_NoFX_CardFromScript_Super` — same class of bug as triangulate-deathwing (wrong
 * creator overwrite in CREATE_CARD_IN_DECK / prediction).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/triangulate-created-by/power-log-triangulate-created-by-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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

/** Deck entity ids after SUB_SPELL_START SpawnToDeck (PowerTaskList id=663) — DISPLAYED_CREATOR=163 (Triangulate). */
const SHUFFLED_COPY_ENTITY_IDS = [182, 183, 184] as const;

/**
 * After Triangulate discover (Source id=163), read Entities[0] entity id then first SHOW_ENTITY CardID for that id.
 */
function parseChosenSpellCardIdFromTriangulateDiscover(raw: string): string | null {
	const marker =
		'Source=[entityName=Triangulate id=163 zone=PLAY zonePos=0 cardId=GDB_451 player=2]';
	const idx = raw.indexOf(marker);
	if (idx < 0) {
		return null;
	}
	const tail = raw.slice(idx);
	const em = tail.match(/Entities\[0\]=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+)/);
	const eid = em?.[1];
	if (!eid) {
		return null;
	}
	const re = new RegExp(
		`SHOW_ENTITY - Updating Entity=\\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${eid}[^\n]+CardID=(\\w+)`,
	);
	const show = tail.match(re);
	return show?.[1] ?? null;
}

describe('Power log replay → Triangulate + Valeera SpawnToDeck deck copies', () => {
	it('fixture: last game, Triangulate play, SpawnToDeck subspell sourced from Valeera hero (HERO_03g)', () => {
		const logPath = resolvePowerLogPathForSlug('triangulate-created-by');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(lines[0]?.includes('CREATE_GAME')).toBe(true);
		const joined = lines.join('\n');
		// PLAY block names entity with empty cardId; GDB_451 arrives on the following SHOW_ENTITY lines.
		expect(joined).toMatch(/BLOCK_START BlockType=PLAY[\s\S]*?CardID=GDB_451/);
		expect(joined).toContain('ReuseFX_Generic_SpawnToDeck_NoFX_CardFromScript_Super');
		expect(joined).toMatch(
			/Source\s*=\s*\[entityName=Deathmantle Valeera id=\d+ zone=PLAY[^\]]*cardId=HERO_03g/,
		);
		const expectedSpell = parseChosenSpellCardIdFromTriangulateDiscover(joined);
		expect(expectedSpell).toBe('WORK_004');
	});

	it(
		'replays log; deck copies from Triangulate shuffle have Triangulate creator and chosen spell cardId',
		async () => {
			const logPath = resolvePowerLogPathForSlug('triangulate-created-by');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const expectedSpellCardId = parseChosenSpellCardIdFromTriangulateDiscover(
				trimPowerLogLinesToLastGame(raw.split(/\r?\n/)).join('\n'),
			);
			expect(expectedSpellCardId).toBe('WORK_004');

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'triangulate-created-by-power-log-replay',
				settleMs: 90_000,
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
