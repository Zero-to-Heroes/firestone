/**
 * Regression: Hearthstone uses {@link CardIds.Frostbite_FrostbittenEnchantment_AV_259e} and
 * {@link CardIds.Frostbite_FrostbittenEnchantment_AV_259e2} (see reporter power.log). Both must be in
 * {@link CURRENT_EFFECTS_WHITELIST} or the deck tracker "Current effects" zone hides them.
 *
 * Fixture: `frostbite-current-effects-truncated.log` — from support zip
 * `1e0e44d3-58b6-4a55-84b4-958e4c64e92c.power.zip`, last game only, truncated after the Frostbite
 * honorable-kill sequence (still contains `CardID=AV_259e` / `CardID=AV_259e2` lines).
 *
 * Run:
 *   npx jest test-tools/bugs/frostbite-current-effects/power-log-frostbite-current-effects-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { CURRENT_EFFECTS_WHITELIST } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import { requirePowerLogFixtureExists, resolvePowerLogPathForSlug } from '../../lib/power-log-replay-harness';

function extractFrostbiteEnchantmentCardIdsFromPowerLogLines(lines: readonly string[]): string[] {
	const ids = new Set<string>();
	for (const line of lines) {
		if (!line.includes('CardID=AV_259')) {
			continue;
		}
		if (line.includes('CardID=AV_259e2')) {
			ids.add(CardIds.Frostbite_FrostbittenEnchantment_AV_259e2);
		} else if (line.includes('CardID=AV_259e') && !line.includes('CardID=AV_259e2')) {
			ids.add(CardIds.Frostbite_FrostbittenEnchantment_AV_259e);
		}
	}
	return [...ids];
}

describe('Frostbite current-effects whitelist (reporter power.log)', () => {
	it('fixture (real log) contains both AV_259e and AV_259e2 enchantment card ids', () => {
		const logPath = resolvePowerLogPathForSlug('frostbite-current-effects');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const fromLog = extractFrostbiteEnchantmentCardIdsFromPowerLogLines(logLines);
		expect(fromLog).toContain(CardIds.Frostbite_FrostbittenEnchantment_AV_259e);
		expect(fromLog).toContain(CardIds.Frostbite_FrostbittenEnchantment_AV_259e2);
	});

	it('CURRENT_EFFECTS_WHITELIST includes both Frostbite enchantment ids (UI filter)', () => {
		expect(CURRENT_EFFECTS_WHITELIST).toContain(CardIds.Frostbite_FrostbittenEnchantment_AV_259e);
		expect(CURRENT_EFFECTS_WHITELIST).toContain(CardIds.Frostbite_FrostbittenEnchantment_AV_259e2);
	});
});
