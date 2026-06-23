/**
 * Regression: copied/replayed Ritual of the Full Moon (EDR_461t) must not corrupt the player deck.
 *
 * Ritual of the New Moon (EDR_461) is the collectible in deck; EDR_461t is the imbue token.
 * In this fixture, entity 130 (Ashamane copy) and entity 219 (Conniving Conman replay) play
 * EDR_461t without drawing from the player's deck — deck size and card ids must stay correct.
 *
 * Fixture: `ritual-full-moon.log` (trimmed from reporter power.log through Conman replay).
 * Override: `POWER_LOG_RITUAL_FULL_MOON_PATH` or slug `ritual-full-moon` in harness.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/ritual-full-moon/power-log-ritual-full-moon-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	CONMAN_RITUAL_ENTITY_ID,
	prepareRitualFullMoonFixtureLines,
	parseRitualFullMoonFixtureMarkers,
	RITUAL_TOKEN_ID,
	truncateLogLinesBeforeFirstRitualPlay,
} from './ritual-full-moon-power-log-helpers';

const ritualTokenId = CardIds.RitualOfTheNewMoon_RitualOfTheFullMoonToken_EDR_461t;
const ritualFullMoonCardName = 'Ritual of the Full Moon';

function expectPlayerDeckWithoutRitualOfTheFullMoon(state: {
	playerDeck: { deck: { cardId?: string; cardName?: string }[]; deckList: { cardId?: string; cardName?: string }[] };
}): void {
	const fullMoonInDeck = state.playerDeck.deck.filter(
		(c) => c.cardId === ritualTokenId || c.cardName === ritualFullMoonCardName,
	);
	const fullMoonInDeckList = state.playerDeck.deckList.filter(
		(c) => c.cardId === ritualTokenId || c.cardName === ritualFullMoonCardName,
	);
	expect(fullMoonInDeck).toEqual([]);
	expect(fullMoonInDeckList).toEqual([]);
}

describe('Power log replay → GameStateService (Ritual of the Full Moon deck)', () => {
	it('parses ritual copy/replay markers from ritual-full-moon.log', () => {
		const logPath = resolvePowerLogPathForSlug('ritual-full-moon');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = prepareRitualFullMoonFixtureLines(raw);
		const markers = parseRitualFullMoonFixtureMarkers(lines);

		expect(markers.localPlayerId).toBe(2);
		expect(markers.ritualTokenId).toBe(RITUAL_TOKEN_ID);
		expect(markers.ashamaneRitualEntityId).toBe(130);
		expect(markers.conmanRitualEntityId).toBe(CONMAN_RITUAL_ENTITY_ID);
		expect(markers.firstRitualPlayLineIndex).toBeGreaterThan(0);
		expect(markers.conmanRitualEndLineIndex).toBeGreaterThan(markers.firstRitualPlayLineIndex);
	});

	it(
		'replays ritual-full-moon.log: player deck must not contain Ritual of the Full Moon after copied ritual plays',
		async () => {
			const logPath = resolvePowerLogPathForSlug('ritual-full-moon');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const fixtureLines = prepareRitualFullMoonFixtureLines(raw);

			const ctx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: fixtureLines,
				reviewId: 'ritual-full-moon-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expectPlayerDeckWithoutRitualOfTheFullMoon(ctx.state);
		},
		120_000,
	);

	it(
		'replays ritual-full-moon.log: copied ritual play must not remove a deck row',
		async () => {
			const logPath = resolvePowerLogPathForSlug('ritual-full-moon');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const fixtureLines = prepareRitualFullMoonFixtureLines(raw);
			const beforePlayLines = truncateLogLinesBeforeFirstRitualPlay(fixtureLines);

			const beforeCtx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: beforePlayLines,
				reviewId: 'ritual-full-moon-before-first-ritual',
			});
			requirePowerLogReplayResult(beforeCtx, cardsPath);

			const afterCtx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: fixtureLines,
				reviewId: 'ritual-full-moon-after-rituals',
			});
			requirePowerLogReplayResult(afterCtx, cardsPath);

			expect(afterCtx.state.playerDeck.deck.length).toBe(beforeCtx.state.playerDeck.deck.length);
			expectPlayerDeckWithoutRitualOfTheFullMoon(afterCtx.state);
		},
		180_000,
	);
});
