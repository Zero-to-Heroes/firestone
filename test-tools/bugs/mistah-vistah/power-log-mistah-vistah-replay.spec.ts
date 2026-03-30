/**
 * Regression: Mistah Vistah's Scenic Vista (secret token VAC_519t3) must appear under Global Effects
 * and accumulate spell ids (e.g. The Coin) after play. Depends on SECRET_CREATED_IN_GAME forwarding
 * creatorEntityId so Scenic Vista links to the minion on board.
 *
 * Fixture: last game trimmed after The Coin is played post–Mistah Vistah (support log 3e1d11d9…).
 *
 * Run:
 *   npx jest test-tools/bugs/mistah-vistah/power-log-mistah-vistah-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	isCardsJsonRefAvailable,
	replayPowerLogToGameState,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const scenicVistaId = CardIds.MistahVistah_ScenicVistaToken_VAC_519t3;
/** The Coin — played as a spell after Mistah in the fixture. */
const coinId = 'GAME_005';

describe('Power log replay → GameStateService (Mistah Vistah / Scenic Vista global effect)', () => {
	it('puts Scenic Vista in globalEffects with tracked spells after creatorEntityId fix', async () => {
		const logPath = resolvePowerLogPathForSlug('mistah-vistah');
		const cardsPath = resolveCardsJsonPath();
		if (!isCardsJsonRefAvailable(cardsPath) || !fs.existsSync(logPath)) {
			return;
		}

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'mistah-vistah-replay',
		});
		if (!ctx) {
			return;
		}

		const { state } = ctx;
		const scenicInPlayer = state.playerDeck.globalEffects.find((c) => c.cardId === scenicVistaId);
		const scenicInOpponent = state.opponentDeck.globalEffects.find((c) => c.cardId === scenicVistaId);
		const scenic = scenicInPlayer ?? scenicInOpponent;

		expect(scenic).toBeDefined();
		expect(scenic!.relatedCardIds?.length ?? 0).toBeGreaterThan(0);
		expect(scenic!.relatedCardIds).toContain(coinId);

		const mistahOwner =
			state.playerDeck.otherZone.some((c) => c.cardId === scenicVistaId) ? state.playerDeck
			: state.opponentDeck;
		const scenicInOther = mistahOwner.otherZone.find((c) => c.cardId === scenicVistaId);
		expect(scenicInOther).toBeDefined();
		expect(scenicInOther!.relatedCardIds ?? []).toContain(coinId);
	}, 120_000);
});
