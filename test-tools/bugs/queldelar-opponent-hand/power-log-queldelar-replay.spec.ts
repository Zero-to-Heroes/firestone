/**
 * Duels: opponent forges Quel'Delar (PVPDR_SCH_Active25 / {@link CardIds.QueldelarTavernBrawl}).
 * The power.log includes `SHOW_ENTITY` for the opponent's hand with `CardID=PVPDR_SCH_Active25` before the card is played.
 * The local player must not see that identity in the opponent hand overlay; the tracker should not set a known `cardId`
 * for that slot (red test until fixed).
 *
 * Fixture: last match from support `5a34c948-bb42-4516-9ae8-44a467a0f080.power.zip`, `trimPowerLogLinesToLastGame` is a
 * no-op. File is sliced from the last `CREATE_GAME` through early weapon play (~lines 6951–12000 in the original export;
 * long enough for entity 178 to appear in the merged snapshot, not the full game—keeps the replay faster).
 *
 * PR: include “I have read the AGENTS.md file before starting”, reference `cards_short.json` / `card-ids.ts` for
 * {@link CardIds.QueldelarTavernBrawl}, mention @cursoragent for first review.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/queldelar-opponent-hand/power-log-queldelar-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
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
	extractOpponentHandQueldelarCardIdFromPowerLogLines,
	findQueldelarEntityCardInReplay,
} from './queldelar-opponent-hand-power-log-helpers';

describe('Power log replay → Quel’Delar in opponent hand (no CardID leak)', () => {
	it(
		'replays queldelar-opponent-hand.log: opponent hand must not reveal Quel’Delar while still in hand',
		async () => {
			const logPath = resolvePowerLogPathForSlug('queldelar');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const leakedFromLog = extractOpponentHandQueldelarCardIdFromPowerLogLines(logLines);
			expect(leakedFromLog).toBe(CardIds.QueldelarTavernBrawl);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'queldelar-opponent-hand-replay',
				settleMs: 12_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			// Forged by visible "Forge de Quel'Delar" (PVPDR_SCH_Active24e1) on the opponent; the resulting
			// weapon in their hand (entity 178) must not be treated as a known `cardId` for the local player.
			const quel = findQueldelarEntityCardInReplay(ctx.state, 178);
			expect(quel).toBeDefined();
			// Red test: `cardId` is currently set from forge + log; it must stay hidden until a fair reveal.
			expect(quel?.cardId).toBeFalsy();
		},
		180_000,
	);
});
