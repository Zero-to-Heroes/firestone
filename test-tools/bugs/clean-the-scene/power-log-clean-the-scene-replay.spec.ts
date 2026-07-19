/**
 * Regression: Incriminating Psychic copies Clean the Scene to opponent hand; after infuse and local
 * player plays their copy, opponent must not keep a stale REV_252 ghost in additionalKnownCardsInHand.
 *
 * Fixture: `clean-the-scene.log` (from test-tools/power.log). Local player 2 plays entity 35;
 * opponent entity 118 (COPIED_FROM_ENTITY_ID=35) remains in hand as REV_252t.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/clean-the-scene/power-log-clean-the-scene-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckState, getDeckTrackerEffectiveHandSize, mergeHandCardsForDeckTrackerDisplay } from '@firestone/game-state';
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
	CLEAN_THE_SCENE_BASE_ID,
	CLEAN_THE_SCENE_INFUSED_ID,
	LOCAL_PLAYER_CLEAN_THE_SCENE_PLAY_ENTITY_ID,
	OPPONENT_STOLEN_CLEAN_THE_SCENE_ENTITY_ID,
	parseLocalPlayerCleanTheScenePlayEntityId,
	parseOpponentStolenCleanTheSceneEntityId,
	parseOpponentStolenCopyCardIdAfterInfuse,
} from './clean-the-scene-power-log-helpers';

const CLEAN_THE_SCENE_IDS = [CardIds.CleanTheScene, CardIds.CleanTheScene_CleanTheSceneToken] as const;

function deckWithEntityId(state: { playerDeck: DeckState; opponentDeck: DeckState }, entityId: number): DeckState | undefined {
	return [state.playerDeck, state.opponentDeck].find((d) => d.hand.some((c) => c.entityId === entityId));
}

function assertNoStaleCleanTheSceneInAdditionalKnown(deck: DeckState): void {
	expect(deck.additionalKnownCardsInHand.filter((c) => c === CLEAN_THE_SCENE_BASE_ID)).toHaveLength(0);
}

describe('Power log replay → GameStateService (Clean the Scene opponent hand ghost)', () => {
	it('fixture: documents local play entity 35 and opponent stolen copy entity 118', () => {
		const logPath = resolvePowerLogPathForSlug('clean-the-scene');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const joined = logLines.join('\n');

		const playEntityId = parseLocalPlayerCleanTheScenePlayEntityId(joined);
		expect(playEntityId).toBe(LOCAL_PLAYER_CLEAN_THE_SCENE_PLAY_ENTITY_ID);

		const opponentEntityId = parseOpponentStolenCleanTheSceneEntityId(joined, playEntityId!);
		expect(opponentEntityId).toBe(OPPONENT_STOLEN_CLEAN_THE_SCENE_ENTITY_ID);
		expect(parseOpponentStolenCopyCardIdAfterInfuse(joined, opponentEntityId!)).toBe(CLEAN_THE_SCENE_INFUSED_ID);
	});

	it(
		'replays log: neither deck keeps stale Clean the Scene in additionalKnownCardsInHand after local play',
		async () => {
			const logPath = resolvePowerLogPathForSlug('clean-the-scene');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const joined = logLines.join('\n');
			const playEntityId = parseLocalPlayerCleanTheScenePlayEntityId(joined);
			const opponentEntityId = parseOpponentStolenCleanTheSceneEntityId(joined, playEntityId!);
			expect(playEntityId).toBe(LOCAL_PLAYER_CLEAN_THE_SCENE_PLAY_ENTITY_ID);
			expect(opponentEntityId).toBe(OPPONENT_STOLEN_CLEAN_THE_SCENE_ENTITY_ID);

			const ctx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: logLines,
				reviewId: 'clean-the-scene-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const deckWithStolenCopy = deckWithEntityId(ctx.state, opponentEntityId!);
			expect(deckWithStolenCopy).toBeDefined();
			expect(deckWithStolenCopy!.hand.some((c) => c.entityId === opponentEntityId)).toBe(true);
			expect(deckWithStolenCopy!.hand.find((c) => c.entityId === opponentEntityId)?.cardId).toBe(
				CLEAN_THE_SCENE_INFUSED_ID,
			);

			assertNoStaleCleanTheSceneInAdditionalKnown(ctx.state.playerDeck);
			assertNoStaleCleanTheSceneInAdditionalKnown(ctx.state.opponentDeck);

			const merged = mergeHandCardsForDeckTrackerDisplay(
				deckWithStolenCopy!.hand,
				deckWithStolenCopy!.additionalKnownCardsInHand,
				ctx.allCardsRef,
			);
			const cleanInMerged = merged.filter((c) =>
				CLEAN_THE_SCENE_IDS.includes(c.cardId as (typeof CLEAN_THE_SCENE_IDS)[number]),
			);
			expect(cleanInMerged).toHaveLength(1);
			expect(getDeckTrackerEffectiveHandSize(deckWithStolenCopy!, ctx.allCardsRef)).toBe(merged.length);
		},
		300_000,
	);
});
