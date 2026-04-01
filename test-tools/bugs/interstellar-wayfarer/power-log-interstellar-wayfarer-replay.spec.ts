/**
 * Regression: Interstellar Wayfarer (GDB_721) Battlecry and Deathrattle each reduce Libram costs
 * in the deck by 1. The play path already called modifyDecksForSpecialCards; deathrattle must too.
 *
 * Fixture: last game from support power log 020d6043…, trimmed to one match, then truncated shortly
 * after PowerTaskList resolves Wayfarer id=24’s deathrattle (before unrelated deck reveals).
 * In this span only one Wayfarer is played; Starslicer is played later in the full log and is excluded.
 * Ground truth: Libram of Faith (GDB_139) ref cost 6; after battlecry + deathrattle → effective 4.
 *
 * Run:
 *   npx jest test-tools/bugs/interstellar-wayfarer/power-log-interstellar-wayfarer-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const libramOfFaith = CardIds.LibramOfFaith_GDB_139;
/** Deck entity that stays in deck through mulligan in the fixture (see power.log). */
const fixtureLibramEntityId = 11;
const refCostLibramOfFaith = 6;
const wayfarerBattlecryAndDeathrattleReduction = 2;
const expectedDeckCostAfter = refCostLibramOfFaith - wayfarerBattlecryAndDeathrattleReduction;

describe('Power log replay → GameStateService (Interstellar Wayfarer deathrattle Libram discount)', () => {
	it('applies deck Libram cost reduction on deathrattle as well as battlecry', async () => {
		const logPath = resolvePowerLogPathForSlug('interstellar-wayfarer');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'interstellar-wayfarer-deathrattle-libram',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state, allCardsRef } = ctx;
		const ref = allCardsRef.getCard(libramOfFaith);
		expect(ref?.cost).toBe(refCostLibramOfFaith);

		const allDeckCards = [...state.playerDeck.deck, ...state.opponentDeck.deck];
		const libram = allDeckCards.find((c) => c.cardId === libramOfFaith && c.entityId === fixtureLibramEntityId);

		expect(libram).toBeDefined();
		expect(libram!.getEffectiveManaCost()).toBe(expectedDeckCostAfter);
	}, 120_000);
});
