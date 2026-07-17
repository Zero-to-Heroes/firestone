/**
 * Regression: playing Tracking ("Discover a card from your deck") must not remove the previewed
 * cards from the local player's deck.
 *
 * Bug: in `tracking-smuggled.log` the local player (Daedin, player 1) plays Tracking (CORE_DS1_184).
 * It creates 3 SETASIDE preview copies (entities 78/79/80) whose `COPIED_FROM_ENTITY_ID` points at
 * still-in-deck originals: Confront the Tol'vir (CATA_560, src 33), Smuggled Shovel (JAIL_380,
 * src 30), Niri of the Crater (TLC_836, src 11). The log ends when the discover choices are shown
 * (nothing picked/drawn yet), so the deck must be unchanged: 2 Smuggled Shovel, 2 Confront, 1 Niri.
 *
 * The `copied-from-entity-id-parser` used to link + dedupe each preview into the player deck, which
 * stripped one deck row per preview (observed 1 / 1 / 0).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/tracking-smuggled/power-log-tracking-smuggled-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const PLAYER_DECKSTRING = 'AAECAR8IpfwGw4MHmacHmqcHm6cHxbEHtMAHrtgHC6mfBK+SB86bB4PAB7XAB7nAB7vAB97EB6zYB9faB9PbBwAA';

const SMUGGLED_SHOVEL = 'JAIL_380';
const CONFRONT_THE_TOLVIR = 'CATA_560';
const NIRI_OF_THE_CRATER = 'TLC_836';

describe('Power log replay → GameStateService (Tracking discover-from-deck preview)', () => {
	it('replays tracking-smuggled.log: previewed cards stay in the player deck (2 Smuggled, 2 Confront, 1 Niri)', async () => {
		const logPath = resolvePowerLogPathForSlug('tracking-smuggled');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		expect(fs.existsSync(logPath)).toBe(true);

		const ctx = await replayPowerLogToGameState({
			logPath,
			playerDeckstring: PLAYER_DECKSTRING,
			reviewId: 'tracking-smuggled-power-log-replay',
			settleMs: 60_000,
		});
		requirePowerLogReplayResult(ctx, cardsPath);

			const countInDeck = (cardId: string): number =>
				ctx.state.playerDeck.deck.filter((c) => c.cardId === cardId).length;

			// TEMP diagnostic: inspect the resulting rows for the 3 previewed cards.
			console.warn(
				'[tracking-diag] rows',
				JSON.stringify(
					ctx.state.playerDeck.deck
						.filter((c) => [SMUGGLED_SHOVEL, CONFRONT_THE_TOLVIR, NIRI_OF_THE_CRATER].includes(c.cardId as string))
						.map((c) => ({
							cardId: c.cardId,
							entityId: c.entityId,
							creatorCardId: c.creatorCardId,
							lastAffectedByCardId: c.lastAffectedByCardId,
						})),
				),
			);

		expect(countInDeck(SMUGGLED_SHOVEL)).toBe(2);
		expect(countInDeck(CONFRONT_THE_TOLVIR)).toBe(2);
		expect(countInDeck(NIRI_OF_THE_CRATER)).toBe(1);

		ctx.cleanup();
	}, 300_000);
});
