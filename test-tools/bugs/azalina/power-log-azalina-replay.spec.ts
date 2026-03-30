/**
 * Azalina Soulthief: when the opponent plays GIL_198, their new hand is a copy of ours — the opponent
 * overlay should show those card IDs. Logs may omit COPIED_FROM_ENTITY_ID and only set DISPLAYED_CREATOR.
 *
 * Run:
 *   npx jest test-tools/bugs/azalina/power-log-azalina-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { replayPowerLogToGameState, resolveCardsJsonPath, resolvePowerLogPathForSlug } from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Azalina opponent hand)', () => {
	it(
		'after opponent plays Azalina, opponent hand cards created by her show our copied card IDs',
		async () => {
			const logPath = resolvePowerLogPathForSlug('azalina');
			const cardsPath = resolveCardsJsonPath();
			if (!fs.existsSync(cardsPath) || !fs.existsSync(logPath)) {
				return;
			}

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'azalina-power-log-replay',
			});
			if (!ctx) {
				return;
			}

			const azalina = CardIds.AzalinaSoulthief;
			const oppFromAzalina = ctx.state.opponentDeck.hand.filter((c) => c.creatorCardId === azalina);
			expect(oppFromAzalina.length).toBeGreaterThan(0);
			const unknown = oppFromAzalina.filter((c) => !c.cardId);
			expect(unknown).toEqual([]);
		},
		120_000,
	);
});
