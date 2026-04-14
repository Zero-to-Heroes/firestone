/**
 * Merch Seller: random spell is put on the opponent's deck with DISPLAYED_CREATOR on the following
 * TagChange (not on FULL_ENTITY). Parser must emit CREATE_CARD_IN_DECK with creator so the draw
 * shows "created by Merch Seller" in the opponent's hand.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/merch-seller/power-log-merch-seller-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (Merch Seller created-by)', () => {
	/** Log uses CORE_ETC_111; reference also exposes ETC_111 for the same card. */
	const merchSellerCreatorIds: readonly string[] = [CardIds.MerchSeller, CardIds.MerchSeller_CORE_ETC_111];

	it('fixture contains Merch Seller spawn-to-deck with DISPLAYED_CREATOR on the next line', () => {
		const logPath = resolvePowerLogPathForSlug('merch-seller');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const text = lines.join('\n');
		expect(text).toContain('Merch Seller');
		expect(text).toContain('tag=DISPLAYED_CREATOR value=196');
		expect(text).toMatch(/FULL_ENTITY[^\n]*id=209[^\n]*zone=DECK/i);
	});

	it(
		'replays merch-seller.log and attributes a card to Merch Seller (opponent deck → hand)',
		async () => {
			const logPath = resolvePowerLogPathForSlug('merch-seller');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'merch-seller-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const withMerchCreator = collectAllDeckCards(ctx.state).filter((c) =>
				merchSellerCreatorIds.includes((c as DeckCard).creatorCardId ?? ''),
			);
			expect(withMerchCreator.length).toBeGreaterThan(0);
		},
		120_000,
	);
});
