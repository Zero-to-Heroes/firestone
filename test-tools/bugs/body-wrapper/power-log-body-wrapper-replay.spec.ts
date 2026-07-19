/**
 * Regression: Body Wrapper — shuffled discover choice should be a known card in deck (reporter log:
 * support ).
 *
 * Fixture:  — last game only ( from last ).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/body-wrapper/power-log-body-wrapper-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

const BODY_WRAPPER_SHUFFLED_DECK_ENTITY_ID = 92;

describe('Power log replay → GameStateService (Body Wrapper shuffle identity)', () => {
	it(
		'body-wrapper.log: after Body Wrapper, deck card 92 is Plagiarizarrr (known in deck)',
		async () => {
			const logPath = resolvePowerLogPathForSlug('body-wrapper');
			requirePowerLogFixtureExists(logPath);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			expect(logLines.some((l) => l.includes('FULL_ENTITY - Creating ID=92'))).toBe(true);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'body-wrapper-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const shuffled = ctx!.state.playerDeck.deck.find(
				(c) => c.entityId === BODY_WRAPPER_SHUFFLED_DECK_ENTITY_ID,
			);
			expect(shuffled).toBeTruthy();
			expect(shuffled!.cardId).toBe(CardIds.Plagiarizarrr);
		},
		90000,
	);
});
