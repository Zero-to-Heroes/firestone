/**
 * Identity Theft (REV_253): "Discover a copy of a card from your opponent's hand and deck."
 * Disciple of the Dove (TIME_037): "Battlecry: Draw a minion. Give minions in your hand +2 Health."
 *
 * Regression: two sequential Identity Theft deck discovers each offer one Disciple of the Dove.
 * The log leaks distinct COPIED_FROM_ENTITY_ID values (23 then 35), but from the player's view
 * those can be the same remaining deck card sampled twice. The tracker must show 1, not 2.
 *
 * Fixture: Chmielinho#2928 (player 2) vs Alan#22298 (player 1). Identity Theft entities 43 and 53.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/identity-theft-dove/power-log-identity-theft-dove-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
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
	DISCIPLE_OF_THE_DOVE_CARD_ID,
	IDENTITY_THEFT_CARD_ID,
	IDENTITY_THEFT_DOVE_OPPONENT_PLAYER_ID,
	parseIdentityTheftDoveFixtureCounts,
} from './identity-theft-dove-power-log-helpers';

describe('Power log replay → GameStateService (Identity Theft sequential Dove deck reveals)', () => {
	it('grounds sequential Identity Theft Dove deck discovers in the fixture', () => {
		const logPath = resolvePowerLogPathForSlug('identity-theft-dove');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseIdentityTheftDoveFixtureCounts(raw.split(/\r?\n/));

		expect(IDENTITY_THEFT_CARD_ID).toBe(CardIds.IdentityTheft);
		expect(DISCIPLE_OF_THE_DOVE_CARD_ID).toBe(CardIds.DiscipleOfTheDove_TIME_037);
		expect(counts.opponentPlayerId).toBe(IDENTITY_THEFT_DOVE_OPPONENT_PLAYER_ID);
		expect(counts.identityTheftPlayCount).toBe(2);
		expect(counts.deckDiscoversWithDove).toHaveLength(2);
		expect(counts.leakedSourceEntityIds).toEqual([23, 35]);
		for (const discover of counts.deckDiscoversWithDove) {
			expect(discover.doveOptionCount).toBe(1);
		}
	});

	it('replays identity-theft-dove.log: sequential Dove reveals count as 1 in opponent deck', async () => {
		const logPath = resolvePowerLogPathForSlug('identity-theft-dove');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const counts = parseIdentityTheftDoveFixtureCounts(raw.split(/\r?\n/));
		expect(counts.leakedSourceEntityIds).toHaveLength(2);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'identity-theft-dove-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			expect(ctx.state.localPlayerId).not.toBe(IDENTITY_THEFT_DOVE_OPPONENT_PLAYER_ID);

			const opponentDeck = ctx.state.opponentDeck;
			const knownInDeck =
				opponentDeck.deck.filter((card) => card.cardId === DISCIPLE_OF_THE_DOVE_CARD_ID).length +
				opponentDeck.additionalKnownCardsInDeck.filter((cardId) => cardId === DISCIPLE_OF_THE_DOVE_CARD_ID)
					.length;

			expect(knownInDeck).toBe(1);
		} finally {
			ctx.cleanup();
		}
	}, 180_000);
});
