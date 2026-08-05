/**
 * Regression: last battle in test-tools/power.log must carry opponent
 * GlobalInfo.TastyLobstersBuff = 9 into the BgsBattleInfo sent to the simulator.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/tasty-lobster-globalinfo/power-log-tasty-lobster-globalinfo-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import * as path from 'path';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
} from '../../lib/power-log-replay-harness';

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..');
const LOG_PATH = path.join(WORKSPACE_ROOT, 'test-tools', 'power.log');

describe('Power log replay → battleInfo GlobalInfo (Tasty Lobster)', () => {
	it('last face-off opponent GlobalInfo.TastyLobstersBuff is 9', async () => {
		const cardsPath = resolveCardsJsonPath();
		if (!fs.existsSync(LOG_PATH)) {
			throw new Error(`Power log not found: ${LOG_PATH}`);
		}
		requirePowerLogReplayPrerequisites(cardsPath, LOG_PATH);

		const ctx = await replayPowerLogToGameState({
			logPath: LOG_PATH,
			reviewId: 'tasty-lobster-globalinfo-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const faceOffs = ctx.state.bgState?.currentGame?.faceOffs ?? [];
		expect(faceOffs.length).toBeGreaterThan(0);

		const summary = faceOffs.map((f, i) => ({
			i,
			oppHero: f.battleInfo?.opponentBoard?.player?.cardId,
			oppBuff: f.battleInfo?.opponentBoard?.player?.globalInfo?.TastyLobstersBuff,
			hasLobster: (f.battleInfo?.opponentBoard?.board ?? []).some(
				(m) => m.cardId === 'BG36_202' || m.cardId === 'BG36_202_G',
			),
			globalInfoKeys: Object.keys(f.battleInfo?.opponentBoard?.player?.globalInfo ?? {}).sort(),
		}));
		console.log('faceOff GlobalInfo summary', JSON.stringify(summary, null, 2));

		const last = faceOffs[faceOffs.length - 1];
		const globalInfo = last.battleInfo?.opponentBoard?.player?.globalInfo;
		expect(globalInfo).toBeDefined();
		expect(Object.keys(globalInfo ?? {})).toContain('TastyLobstersBuff');
		expect(globalInfo?.TastyLobstersBuff).toBe(9);
	}, 300_000);
});
