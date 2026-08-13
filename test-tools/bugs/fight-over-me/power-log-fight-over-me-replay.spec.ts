/**
 * Fight Over Me (ETC_316): "Choose two enemy minions. They fight! Add copies of any that die to your hand."
 *
 * The opponent-hand copy (entity 244) should be flagged as Tigress Plushy (TOY_811), the minion
 * that died. A full fast replay flushes PredictCardId after PTL DEATHS, so the oracle sees the
 * graveyard and looks fine. Live (and this truncated feed) flushes after the hand FULL_ENTITY
 * and before DEATHS — the reported miss.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/fight-over-me/power-log-fight-over-me-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { DeckCard } from '@firestone/game-state';
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
	DIED_FIGHTER_CARD_ID,
	FIGHT_OVER_ME_CARD_ID,
	FIGHT_OVER_ME_GIFT_ENTITY_ID,
	FIGHT_OVER_ME_POWER_LOG_PATH,
	parseFightOverMeFixtureMarkers,
	slicePowerLogBeforePtlDeaths,
} from './fight-over-me-power-log-helpers';

const findHandRow = (hand: readonly DeckCard[], entityId: number): DeckCard | undefined =>
	hand.find((c) => (c.entityId ?? c.trueEntityId) === entityId);

describe('Power log replay → Fight Over Me opponent-hand oracle', () => {
	const slug = 'fight-over-me';

	it('fixture: PTL creates hand copy 244 before Tigress DEATHS', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		expect(logPath).toBe(FIGHT_OVER_ME_POWER_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = raw.split(/\r?\n/);
		const markers = parseFightOverMeFixtureMarkers(lines);
		expect(markers.ptlGiftFullEntityLineIndex).toBeGreaterThan(0);
		expect(markers.ptlDeathsBlockLineIndex).toBeGreaterThan(markers.ptlGiftDisplayedCreatorLineIndex);
		expect(lines[markers.ptlGiftFullEntityLineIndex]).toContain('id=244');
		expect(lines[markers.ptlTigressToGraveyardLineIndex]).toContain('id=30');
	});

	it('replays log cut before PTL DEATHS; opponent hand entity 244 is flagged as TOY_811', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const prefix = slicePowerLogBeforePtlDeaths(logLines);

		const ctx = await replayPowerLogToGameState({
			logPath,
			logLinesOverride: prefix,
			reviewId: 'fight-over-me-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const gift = findHandRow(ctx.state.opponentDeck.hand, FIGHT_OVER_ME_GIFT_ENTITY_ID);
		expect(gift).toBeDefined();
		expect(gift!.creatorCardId).toBe(FIGHT_OVER_ME_CARD_ID);
		expect(gift!.cardId).toBe(DIED_FIGHTER_CARD_ID);
	}, 180_000);
});
