/**
 * Wrong `cardCopyLinks` from Divergence pairs entity **26** with split half **146**. Playing **146** mirrors
 * {@link SPLIT_MINION_CARD_ID} onto **{@link WRONG_ROW_ENTITY_ID}** via `processCardLinks`; that must not happen.
 *
 * Fixture: **`divergence-hellfire.log`** ends at `PowerProcessor.EndCurrentTaskList` after playing split entity **146** (task list **679**).
 * Full match: `divergence-hellfire-full-last-game.log`.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/divergence-hellfire/power-log-divergence-hellfire-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	collectAllDeckCards,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';
import {
	HAND_SPLIT_FIXTURE_LINE_COUNT,
	HELLFIRE_CARD_ID_GROUND_TRUTH,
	SPLIT_MINION_CARD_ID,
	WRONG_ROW_ENTITY_ID,
} from './divergence-hellfire-power-log-helpers';

describe('Power log replay → GameStateService (Divergence link must not steal unrelated hand row)', () => {
	it(
		'replays log cut after play of split entity 146: entity 26 must not show Agamaggan',
		async () => {
			const logPath = resolvePowerLogPathForSlug('divergence-hellfire');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			let logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			while (logLines.length && logLines[logLines.length - 1] === '') {
				logLines = logLines.slice(0, -1);
			}
			expect(logLines.length).toBe(HAND_SPLIT_FIXTURE_LINE_COUNT);
			const last = logLines[logLines.length - 1]!;
			expect(last).toContain('EndCurrentTaskList');
			expect(last).toContain('679');

			const ctx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: logLines,
				reviewId: 'divergence-hellfire-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const matches = collectAllDeckCards(ctx.state).filter((c) => c.entityId === WRONG_ROW_ENTITY_ID);
			expect(matches.length).toBe(1);
			const row = matches[0]!;
			expect(row.cardId).not.toBe(SPLIT_MINION_CARD_ID);
			expect(row.cardId).not.toBe(HELLFIRE_CARD_ID_GROUND_TRUTH);
			const pool = row.guessedInfo?.possibleCards ?? [];
			if (pool.length > 0) {
				expect(pool).not.toContain(SPLIT_MINION_CARD_ID);
			}
		},
		120_000,
	);
});
