/**
 * Regression (Phase 1 — red test): Opponent (HeXecutor, player 1) has Azalina Soulsever; start-of-game
 * creates 20 deck copies. After battlecry draws entity 92 and they play that Spiderling, opponent deck
 * should have 19 Azalina-created cards — not 20.
 *
 * Fixture: `azalina-soulsever-deck.log` (truncated from test-tools/power.log). Local player Chmielinho
 * (player 2).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/azalina-soulsever-deck/power-log-azalina-soulsever-deck-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	assertAzalinaSoulseverDeckAnchorsFromPowerLogLines,
	AZALINA_CARD_ID,
	AZALINA_COPY_ENTITY_IDS,
	AZALINA_PLAYER_CONTROLLER,
	azalinaCasterDeckFromReplayState,
	countAzalinaDeckCopyEntityIdsFromLog,
	EXPECTED_AZALINA_COPIES_AFTER_PLAY,
	PLAYED_COPY_ENTITY,
	prepareAzalinaSoulseverDeckFixtureLines,
} from './azalina-soulsever-deck-power-log-helpers';

describe('Power log replay → Azalina Soulsever deck copy count after opponent plays drawn copy', () => {
	it('fixture: last game, 20 Azalina deck copies, entity 92 drawn and played', () => {
		const logPath = resolvePowerLogPathForSlug('azalina-soulsever-deck');
		requirePowerLogFixtureExists(logPath);
		const lines = prepareAzalinaSoulseverDeckFixtureLines(fs.readFileSync(logPath, 'utf8'));
		expect(countAzalinaDeckCopyEntityIdsFromLog(lines)).toBe(AZALINA_COPY_ENTITY_IDS.length);
		assertAzalinaSoulseverDeckAnchorsFromPowerLogLines(lines);
	});

	it('replays log; after opponent plays Azalina-created Spiderling, 19 Azalina copies remain in deck', async () => {
		const logPath = resolvePowerLogPathForSlug('azalina-soulsever-deck');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'azalina-soulsever-deck-replay',
			settleMs: 90_000,
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		expect(ctx.state.localPlayerId).not.toBe(AZALINA_PLAYER_CONTROLLER);

		const casterDeck = azalinaCasterDeckFromReplayState(ctx.state);
		const azalinaDeck = casterDeck.deck.filter((c) => c.creatorCardId === AZALINA_CARD_ID);

		expect(azalinaDeck.length).toBe(EXPECTED_AZALINA_COPIES_AFTER_PLAY);

		const deckEntityId = (c: { entityId?: number; trueEntityId?: number }) => c.entityId;
		expect(azalinaDeck.some((c) => deckEntityId(c) === PLAYED_COPY_ENTITY)).toBe(false);
	}, 180_000);
});
