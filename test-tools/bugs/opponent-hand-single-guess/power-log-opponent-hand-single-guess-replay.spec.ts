/**
 * Integration test: replay trimmed power.log from support (24eff3c4…),
 * assert opponent hand has slots with singleton guessedInfo.possibleCards (list vs marker display bug).
 *
 * Run:
 *   HS_REFERENCE_CARDS_JSON_PATH=../hs-reference-data/src/cards_short.json \
 *   npx jest test-tools/bugs/opponent-hand-single-guess/power-log-opponent-hand-single-guess-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { DeckCard } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

describe('Power log replay → GameStateService (opponent hand singleton possibleCards)', () => {
	const slug = 'opponent-hand-single-guess';

	it(
		'replays fixture and expects at least one opponent hand card with empty cardId and exactly one possibleCards entry',
		async () => {
			const logPath = resolvePowerLogPathForSlug(slug);
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			expect(logLines.length).toBeGreaterThan(100);

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'opponent-hand-single-guess-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const hand = ctx.state.opponentDeck.hand;
			const singletonGuess = hand.filter(
				(c: DeckCard) =>
					!c.cardId?.length &&
					c.guessedInfo?.possibleCards?.length === 1 &&
					!!c.guessedInfo.possibleCards[0]?.length,
			);
			expect(singletonGuess.length).toBeGreaterThan(0);
		},
		120_000,
	);
});
