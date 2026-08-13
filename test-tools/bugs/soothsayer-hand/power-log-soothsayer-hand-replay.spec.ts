/**
 * Regression: Incriminating Psychic deathrattle copied two Soothsayers from the opponent's hand
 * at once. The opponent-hand overlay should show Soothsayer twice (additionalKnownCardsInHand
 * multiplicity), without stamping cardId onto the hidden source entities.
 *
 * Fixture: soothsayer-hand.log (from test-tools/power.log). Local player 1 (Chmielinho);
 * Psychic entity 35 copies JAIL_912 from opponent hand entities 56 and 60 into local 126/127.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/soothsayer-hand/power-log-soothsayer-hand-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { mergeHandCardsForDeckTrackerDisplay } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	parseIncriminatingPsychicSoothsayerCopiesFromLog,
	SOOTHSAYER_CARD_ID,
} from './soothsayer-hand-power-log-helpers';

describe('Power log replay → GameStateService (Incriminating Psychic two Soothsayers)', () => {
	const slug = 'soothsayer-hand';

	it('parses two PowerTaskList Soothsayer copies from Incriminating Psychic deathrattle', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const fixture = parseIncriminatingPsychicSoothsayerCopiesFromLog(
			trimPowerLogLinesToLastGame(raw.split(/\r?\n/)),
		);

		expect(fixture.psychicCardId).toBe(CardIds.IncriminatingPsychic);
		expect(fixture.copies).toHaveLength(2);
		expect(fixture.copies.every((c) => c.copyCardId === SOOTHSAYER_CARD_ID)).toBe(true);
		expect(new Set(fixture.copies.map((c) => c.sourceEntityId)).size).toBe(2);
	});

	it('replays log: opponent overlay shows Soothsayer twice without stamping source hand slots', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const raw = fs.readFileSync(logPath, 'utf8');
		const fixture = parseIncriminatingPsychicSoothsayerCopiesFromLog(
			trimPowerLogLinesToLastGame(raw.split(/\r?\n/)),
		);
		const expectedCount = fixture.copies.length;

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'soothsayer-hand-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			const opponentDeck = ctx.state.opponentDeck;
			for (const copy of fixture.copies) {
				const source = opponentDeck.hand.find((c) => c.entityId === copy.sourceEntityId);
				expect(source).toBeDefined();
				expect(source!.cardId).not.toBe(SOOTHSAYER_CARD_ID);
			}

			const knownSoothsayers = opponentDeck.additionalKnownCardsInHand.filter((id) => id === SOOTHSAYER_CARD_ID);
			expect(knownSoothsayers).toHaveLength(expectedCount);

			const merged = mergeHandCardsForDeckTrackerDisplay(
				opponentDeck.hand,
				opponentDeck.additionalKnownCardsInHand,
				ctx.allCardsRef,
			);
			expect(merged.filter((c) => c.cardId === SOOTHSAYER_CARD_ID)).toHaveLength(expectedCount);
		} finally {
			ctx.cleanup();
		}
	}, 180_000);
});
