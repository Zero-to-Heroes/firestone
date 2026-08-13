/**
 * Regression: Untimely Death must be ruled out of the Hunter secret helper when a
 * friendly minion dies the turn after being played and the secret does not trigger.
 *
 * Secret: When a friendly minion dies the turn after being played, resummon it.
 *
 * Fixture: opponent plays unknown Hunter secret (entity 148) on game turn 14;
 * Sketchy Stranger (entity 143) is played that turn and dies on game turn 15
 * with NUM_TURNS_IN_PLAY=1. Entity 148 never SECRET-triggers.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/untimely-death-secret/power-log-untimely-death-secret-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import type { GameState } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
	replayPowerLogToGameState,
} from '../../lib/power-log-replay-harness';
import {
	HUNTER_SECRET_ENTITY_ID,
	logShowsEntity148EnteringSecretAsHunter,
	logShowsNoSecretTriggerOnEntity148,
	logShowsSketchyStrangerDiedTheTurnAfterPlay,
} from './untimely-death-secret-power-log-helpers';

function findOpponentHunterSecret(state: GameState) {
	const all = [...state.opponentDeck.secrets, ...state.playerDeck.secrets];
	return all.find((s) => s.entityId === HUNTER_SECRET_ENTITY_ID);
}

describe('Power log replay → GameStateService (Untimely Death secret helper)', () => {
	it('fixture: log captures Hunter secret 148 and Sketchy Stranger dying the turn after play', () => {
		const logPath = resolvePowerLogPathForSlug('untimely-death-secret');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(logShowsEntity148EnteringSecretAsHunter(lines)).toBe(true);
		expect(logShowsSketchyStrangerDiedTheTurnAfterPlay(lines)).toBe(true);
		expect(logShowsNoSecretTriggerOnEntity148(lines)).toBe(true);
	});

	it('rules out Untimely Death after a friendly minion dies the turn after being played', async () => {
		const slug = 'untimely-death-secret';
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'untimely-death-secret-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state } = ctx;
		const boardSecret = findOpponentHunterSecret(state);
		if (boardSecret == null) {
			const dump = (secrets: typeof state.opponentDeck.secrets) =>
				JSON.stringify(secrets.map((s) => ({ e: s.entityId, card: s.cardId, n: s.allPossibleOptions.length })));
			throw new Error(
				`Unknown Hunter secret entity ${HUNTER_SECRET_ENTITY_ID} missing — opponent: ${dump(
					state.opponentDeck.secrets,
				)} player: ${dump(state.playerDeck.secrets)}`,
			);
		}

		const untimelyDeath = boardSecret.allPossibleOptions.find((o) => o.cardId === CardIds.UntimelyDeath_TIME_620);
		expect(untimelyDeath).toBeDefined();
		expect(untimelyDeath!.isValidOption).toBe(false);
	}, 120_000);
});
