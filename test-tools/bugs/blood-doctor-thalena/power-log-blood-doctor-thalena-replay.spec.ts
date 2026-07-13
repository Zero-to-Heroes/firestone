/**
 * Regression: Blood Doctor Thal'ena grants a second hero power (Vampyr's Kiss) that should appear
 * alongside the primary hero power in the deck tracker's board zone.
 *
 * Fixture: `blood-doctor-thalena.log` in this folder.
 *
 * Run:
 *   HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json \
 *   npx jest test-tools/bugs/blood-doctor-thalena/power-log-blood-doctor-thalena-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { DeckState } from '@firestone/game-state';
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
	extractAdditionalHeroPowerFromPowerLogLines,
	extractPrimaryHeroPowerFromPowerLogLines,
} from './blood-doctor-thalena-power-log-helpers';

function collectTrackedHeroPowerCardIds(deck: DeckState): string[] {
	return [
		deck.heroPower?.cardId,
		...deck.additionalHeroPowers.map((hp) => hp.cardId),
	].filter((cardId): cardId is string => !!cardId);
}

function collectTrackedHeroPowerEntityIds(deck: DeckState): number[] {
	return [
		deck.heroPower?.entityId,
		...deck.additionalHeroPowers.map((hp) => hp.entityId),
	].filter((entityId): entityId is number => entityId != null);
}

describe('Power log replay → GameStateService (Blood Doctor Thalena additional hero power)', () => {
	it('parses primary and additional hero powers from blood-doctor-thalena.log', () => {
		const logPath = resolvePowerLogPathForSlug('blood-doctor-thalena');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));

		const primary = extractPrimaryHeroPowerFromPowerLogLines(logLines);
		const additional = extractAdditionalHeroPowerFromPowerLogLines(logLines);

		expect(primary).toEqual({ entityId: 67, cardId: 'HERO_11lbp' });
		expect(additional).toEqual({ entityId: 100, cardId: 'JAIL_446hp' });
	});

	it(
		'tracks both hero powers on playerDeck after Blood Doctor Thalena battlecry',
		async () => {
			const logPath = resolvePowerLogPathForSlug('blood-doctor-thalena');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const primary = extractPrimaryHeroPowerFromPowerLogLines(logLines);
			const additional = extractAdditionalHeroPowerFromPowerLogLines(logLines);
			expect(primary).toBeTruthy();
			expect(additional).toBeTruthy();

			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'blood-doctor-thalena-power-log-replay',
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			const cardIds = collectTrackedHeroPowerCardIds(ctx.state.playerDeck);
			expect(cardIds).toEqual(expect.arrayContaining([primary!.cardId, additional!.cardId]));
			expect(cardIds).toHaveLength(2);

			const entityIds = collectTrackedHeroPowerEntityIds(ctx.state.playerDeck);
			expect(entityIds).toEqual(expect.arrayContaining([primary!.entityId, additional!.entityId]));
			expect(entityIds).toHaveLength(2);
		},
		120_000,
	);
});
