/**
 * Regression: discover options from Blood Draw (TIME_612) keep power.log order (Crypt Map / TLC_435 first).
 *
 * Fixture: single-game slice ending at Blood Draw discover `WaitThenShowChoices … BEGIN` (~3301 lines).
 * Replay uses the full file so `playerDeck.currentOptions` stays set (no SendChoices in fixture).
 *
 * Run:
 *   npx jest test-tools/bugs/discover-zone-order/power-log-discover-zone-order-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
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
	BLOOD_DRAW_DISCOVER_CARD_IDS_FROM_FIXTURE,
	extractDiscoverCardIdsAfterChoicesSource,
	sliceLogThroughBloodDrawDiscoverWaitBegin,
} from './discover-zone-order-power-log-helpers';

describe('Power log replay → discover option order (Blood Draw)', () => {
	it('fixture lists Crypt Map first in DebugPrintEntityChoices after Blood Draw', () => {
		const logPath = resolvePowerLogPathForSlug('discover-zone-order');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const ids = extractDiscoverCardIdsAfterChoicesSource(lines, 'TIME_612');
		expect(ids).toEqual([...BLOOD_DRAW_DISCOVER_CARD_IDS_FROM_FIXTURE]);
	});

	it(
		'replays through Blood Draw discover BEGIN and keeps currentOptions in log order',
		async () => {
			const logPath = resolvePowerLogPathForSlug('discover-zone-order');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const trimmed = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const replayLines = sliceLogThroughBloodDrawDiscoverWaitBegin(trimmed);

			const ctx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: replayLines,
				reviewId: 'discover-zone-order-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const optionIds = ctx.state.playerDeck.currentOptions.map((o) => o.cardId);
			expect(optionIds).toEqual([...BLOOD_DRAW_DISCOVER_CARD_IDS_FROM_FIXTURE]);
		},
		120_000,
	);
});
