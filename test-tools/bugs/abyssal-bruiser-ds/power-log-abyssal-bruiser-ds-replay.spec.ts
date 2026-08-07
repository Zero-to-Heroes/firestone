/**
 * Regression: Abyssal Bruiser (BG35_921, entity 6743) with Toreth's Blessing
 * (DIVINE_SHIELD tag value=3) must be sent to the simulator with divineShield: true.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/abyssal-bruiser-ds/power-log-abyssal-bruiser-ds-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import { extractLastPreBattleDivineShieldForEntity6743 } from './abyssal-bruiser-ds-power-log-helpers';

const ENTITY_ID = 6743;
const ABYSSAL_BRUISER = CardIds.AbyssalBruiser_BG35_921;

describe('Power log replay → battleInfo divineShield (Abyssal Bruiser + Toreth)', () => {
	it('fixture log has DIVINE_SHIELD=3 on entity 6743 before last PTL battle start', () => {
		const logPath = resolvePowerLogPathForSlug('abyssal-bruiser-ds');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const ds = extractLastPreBattleDivineShieldForEntity6743(logLines);
		expect(ds).toBe(3);
	});

	it(
		'last face-off battleInfo has entity 6743 with divineShield true',
		async () => {
			const logPath = resolvePowerLogPathForSlug('abyssal-bruiser-ds');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const expectedDsTag = extractLastPreBattleDivineShieldForEntity6743(logLines);
			expect(expectedDsTag).toBe(3);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'abyssal-bruiser-ds-replay',
				// Large BG fixture; if a parser throw causes infinite queue retry, bail with
				// whatever faceOff state we have rather than sitting on the 10-minute default.
				processingQueueIdleTimeoutMs: 120_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);
			try {
				const faceOffs = ctx.state.bgState?.currentGame?.faceOffs ?? [];
				expect(faceOffs.length).toBeGreaterThan(0);

				const last = faceOffs[faceOffs.length - 1];
				const boards: readonly BoardEntity[] = [
					...(last.battleInfo?.playerBoard?.board ?? []),
					...(last.battleInfo?.opponentBoard?.board ?? []),
				];
				const bruiser = boards.find((m) => m.entityId === ENTITY_ID || m.cardId === ABYSSAL_BRUISER);
				expect(bruiser).toBeDefined();
				console.log('entity 6743 battleInfo snapshot', {
					entityId: bruiser?.entityId,
					cardId: bruiser?.cardId,
					divineShield: bruiser?.divineShield,
					extraDivineShieldCharges: bruiser?.extraDivineShieldCharges,
					logDivineShieldTag: expectedDsTag,
				});
				expect(bruiser!.divineShield).toBe(true);
			} finally {
				ctx.cleanup();
			}
		},
		300_000,
	);
});
