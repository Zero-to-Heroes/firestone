import * as fs from 'fs';
import * as path from 'path';
import { ReplayParser } from '../replay-parser';

const WORKSPACE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const POWER_LOG = path.join(WORKSPACE_ROOT, 'test-tools', 'eternal.log');

describe('EternalKnightAttackBuff on BATTLEGROUNDS_PLAYER_BOARD', () => {
	jest.setTimeout(300_000);

	it('sets player GlobalInfo Eternal Knight flat buffs from Eternal Portrait', () => {
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

		const withPortrait = boardEvents.filter((e) =>
			(e?.PlayerBoard?.Trinkets ?? []).some((t: { cardId?: string }) => t.cardId === 'BG36_MagicItem_216'),
		);
		expect(withPortrait.length).toBeGreaterThan(0);

		const withBuff = withPortrait.filter((e) => (e?.PlayerBoard?.GlobalInfo?.EternalKnightAttackBuff ?? 0) > 0);
		const summary = withPortrait.map((e, i) => ({
			i,
			attack: e?.PlayerBoard?.GlobalInfo?.EternalKnightAttackBuff,
			health: e?.PlayerBoard?.GlobalInfo?.EternalKnightHealthBuff,
		}));
		console.log('Eternal Portrait GlobalInfo summary', JSON.stringify(summary, null, 2));

		expect(withBuff.length).toBeGreaterThan(0);

		const last = withBuff[withBuff.length - 1];
		const attack = last?.PlayerBoard?.GlobalInfo?.EternalKnightAttackBuff ?? 0;
		const health = last?.PlayerBoard?.GlobalInfo?.EternalKnightHealthBuff ?? 0;
		expect(attack).toBe(220);
		expect(health).toBe(110);
		expect(attack).toBe(2 * health);
		expect(attack % 4).toBe(0);
	});
});
