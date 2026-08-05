import * as fs from 'fs';
import * as path from 'path';
import { ReplayParser } from '../replay-parser';

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const POWER_LOG = path.join(WORKSPACE_ROOT, 'test-tools', 'power.log');

describe('TastyLobstersBuff on BATTLEGROUNDS_PLAYER_BOARD', () => {
	jest.setTimeout(300_000);

	it('sets opponent GlobalInfo.TastyLobstersBuff to 9 on the last battle', () => {
		if (!fs.existsSync(POWER_LOG)) {
			throw new Error(`Power log not found: ${POWER_LOG}`);
		}
		const lines = fs.readFileSync(POWER_LOG, 'utf8').split(/\r?\n/);
		const parser = new ReplayParser();
		const boardEvents: any[] = [];
		parser.onGameEvent = (event) => {
			if (event.Type === 'BATTLEGROUNDS_PLAYER_BOARD') {
				boardEvents.push(event.Value);
			}
		};
		parser.FromString(lines);

		expect(boardEvents.length).toBeGreaterThan(0);
		const summary = boardEvents.map((e, i) => ({
			i,
			oppHero: e?.OpponentBoard?.CardId,
			oppBuff: e?.OpponentBoard?.GlobalInfo?.TastyLobstersBuff,
			playerBuff: e?.PlayerBoard?.GlobalInfo?.TastyLobstersBuff,
			oppHasLobster: (e?.OpponentBoard?.Board ?? []).some(
				(m: { CardId?: string }) => m.CardId === 'BG36_202' || m.CardId === 'BG36_202_G',
			),
		}));
		console.log('board GlobalInfo summary', JSON.stringify(summary, null, 2));

		const last = boardEvents[boardEvents.length - 1];
		expect(last?.OpponentBoard?.GlobalInfo?.TastyLobstersBuff).toBe(9);
		expect(summary[summary.length - 1].oppHasLobster).toBe(true);
	});
});
