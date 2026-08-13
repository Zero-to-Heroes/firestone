/**
 * Regression: Flames of Infinity must stay in the Mage secret helper when the enemy
 * ends their turn with only a Location on board (no minions to damage).
 *
 * Fixture: opponent Mad Scientist puts unknown Mage secret (entity 17) into play;
 * local Priest plays Cathedral of Atonement and ends turn with no minions.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/flames-infinity-secret/power-log-flames-infinity-secret-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import type { GameState } from '@firestone/game-state';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';

/** Mad Scientist deathrattle secret in flames-infinity-secret.log (opponent Mage). */
const MAGE_SECRET_ENTITY_ID = 17;

function findOpponentSecret(state: GameState) {
	const all = [...state.opponentDeck.secrets, ...state.playerDeck.secrets];
	return (
		all.find((s) => s.entityId === MAGE_SECRET_ENTITY_ID) ??
		all.find((s) => s.cardId === '' && s.allPossibleOptions.length > 0)
	);
}

describe('Power log replay → GameStateService (Flames of Infinity secret helper)', () => {
	it('keeps Flames of Infinity when the enemy turn ends with only a Location on board', async () => {
		const slug = 'flames-infinity-secret';
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogFixtureExists(logPath);
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'flames-infinity-secret-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state } = ctx;
		const boardSecret = findOpponentSecret(state);
		if (boardSecret == null) {
			const dump = (secrets: typeof state.opponentDeck.secrets) =>
				JSON.stringify(secrets.map((s) => ({ e: s.entityId, card: s.cardId, n: s.allPossibleOptions.length })));
			throw new Error(
				`Unknown Mage secret missing — opponent: ${dump(state.opponentDeck.secrets)} player: ${dump(
					state.playerDeck.secrets,
				)}`,
			);
		}

		const flames = boardSecret.allPossibleOptions.find((o) => o.cardId === CardIds.FlamesOfInfinity_END_024);
		expect(flames).toBeDefined();
		expect(flames!.isValidOption).toBe(true);
	}, 120_000);
});
