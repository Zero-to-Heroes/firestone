/**
 * Regression: after Perjury triggers and casts a discovered secret, that new secret
 * must not be offered as Perjury again (Discover excludes the source card; you cannot
 * have two copies of the same secret from that pool).
 *
 * Perjury: Secret: When your turn starts, Discover and cast a Secret from another class.
 *
 * Fixture: truncated after Perjury (entity 158) discovers and puts entity 173 into
 * SECRET as an unknown Rogue 2-cost secret. Cutoff is EndCurrentTaskList 614
 * (MAIN_ACTION), before Sands of Time and before 173 later reveals as Double Cross.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/perjury-secret/power-log-perjury-secret-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	PERJURY_CREATED_SECRET_ENTITY_ID,
	logDoesNotRevealEntity173,
	logShowsEntity173EnteringSecretAsRogueCost2,
	logShowsPerjuryTriggered,
} from './perjury-secret-power-log-helpers';

const PERJURY_CARD_IDS = [CardIds.Perjury, CardIds.Perjury_CORE_MAW_018] as const;

function findCreatedSecret(state: GameState) {
	const all = [...state.opponentDeck.secrets, ...state.playerDeck.secrets];
	return all.find((s) => s.entityId === PERJURY_CREATED_SECRET_ENTITY_ID);
}

describe('Power log replay → GameStateService (Perjury-created secret cannot be Perjury)', () => {
	it('fixture: log captures Perjury trigger then hidden Rogue secret 173, without revealing it', () => {
		const logPath = resolvePowerLogPathForSlug('perjury-secret');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(logShowsPerjuryTriggered(lines)).toBe(true);
		expect(logShowsEntity173EnteringSecretAsRogueCost2(lines)).toBe(true);
		expect(logDoesNotRevealEntity173(lines)).toBe(true);
	});

	it('rules out Perjury as a possible option for the secret Perjury just cast', async () => {
		const slug = 'perjury-secret';
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'perjury-secret-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const { state } = ctx;
		const boardSecret = findCreatedSecret(state);
		if (boardSecret == null) {
			const dump = (secrets: typeof state.opponentDeck.secrets) =>
				JSON.stringify(secrets.map((s) => ({ e: s.entityId, card: s.cardId, n: s.allPossibleOptions.length })));
			throw new Error(
				`Perjury-created secret entity ${PERJURY_CREATED_SECRET_ENTITY_ID} missing — opponent: ${dump(
					state.opponentDeck.secrets,
				)} player: ${dump(state.playerDeck.secrets)}`,
			);
		}

		const stillSuggested = boardSecret.allPossibleOptions.filter(
			(o) => PERJURY_CARD_IDS.includes(o.cardId as (typeof PERJURY_CARD_IDS)[number]) && o.isValidOption,
		);
		expect(stillSuggested.map((o) => o.cardId)).toEqual([]);
	}, 180_000);
});
