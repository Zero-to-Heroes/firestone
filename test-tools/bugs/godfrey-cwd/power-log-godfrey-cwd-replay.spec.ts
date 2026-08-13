/**
 * Regression (Phase 1 — red test): a Cast When Drawn card overdrawn under Godfrey must be
 * queued (not auto-cast), then sit in opponent hand after Atlas returns it.
 *
 * Fixture: `godfrey-cwd.log` — last game from test-tools/power.log, truncated after the
 * PowerTaskList OverrideSpawn that moves return token 142 SETASIDE → HAND
 * (`EndCurrentTaskList` for that task list). Local player is Chmielinho (player 1);
 * opponent Yuri has Godfrey. Life Tap overdraws Shred of Time (TIME_025t, entity 130);
 * Atlas intercepts (BURNED_CARD, no CASTS_WHEN_DRAWN trigger). Later OverrideSpawn puts
 * token 142 in hand; CWD still does not fire. Cutoff drops the later Velocidrake CWD
 * (entity 154) and the second Godfrey return (148).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/godfrey-cwd/power-log-godfrey-cwd-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { buildGofreyCards, DeckCard, getDisplayCardIdWhenGuessedPoolIsSingleCard } from '@firestone/game-state';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	DEMONIC_CONFINEMENT_CARD_ID,
	GODFREY_ATLAS_CREATOR,
	parseGodfreyCwdOverdraw,
	parseGodfreyOverdrawBurnedCards,
	parseGodfreyReturnedHandEntityIds,
	parseLastGodfreyAtlasPendingCount,
	SHRED_OF_TIME_CARD_ID,
} from './godfrey-cwd-power-log-helpers';

describe('Power log replay → GameStateService (Godfrey Cast When Drawn overdraw)', () => {
	const slug = 'godfrey-cwd';

	it('fixture: truncated log has Godfrey CWD overdraw return, no CWD trigger, no entity 154', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');

		expect(raw).toContain('JAIL_509');
		expect(raw).toContain('JAILFX_Godfrey_CardsInHand_OverrideSpawn');
		expect(raw).toContain('tag=GODFREY_OVERDRAW_PROTECTION value=1');
		expect(raw).not.toContain('TriggerKeyword=CASTS_WHEN_DRAWN');
		expect(raw).not.toContain('Creating ID=154');

		const cwd = parseGodfreyCwdOverdraw(raw);
		expect(cwd).not.toBeNull();
		expect(cwd!.cardId).toBe(SHRED_OF_TIME_CARD_ID);
		expect(cwd!.burnedEntityId).toBe(130);
		expect(cwd!.returnTokenEntityId).toBe(142);

		const returned = parseGodfreyReturnedHandEntityIds(raw);
		expect(returned).toEqual([142]);

		const pending = parseLastGodfreyAtlasPendingCount(raw);
		expect(pending).toBe(1);

		const burned = parseGodfreyOverdrawBurnedCards(raw);
		expect(burned.map((c) => c.cardId)).toEqual(
			expect.arrayContaining([SHRED_OF_TIME_CARD_ID, DEMONIC_CONFINEMENT_CARD_ID]),
		);
	});

	it('replays godfrey-cwd.log; CWD Shred of Time is burned/queued then sits in hand, not auto-cast', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const raw = fs.readFileSync(logPath, 'utf8');

		const cwd = parseGodfreyCwdOverdraw(raw);
		expect(cwd).not.toBeNull();
		const pendingFromLog = parseLastGodfreyAtlasPendingCount(raw);
		expect(pendingFromLog).toBe(1);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'godfrey-cwd-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		expect(ctx.state.opponentDeck.globalEffects.some((c) => c.cardId === CardIds.GodfreytheBetrayer_JAIL_509)).toBe(
			true,
		);

		const burnedInState = ctx.state.opponentDeck.burnedCards;
		expect(burnedInState.some((c) => c.cardId === cwd!.cardId && c.entityId === cwd!.burnedEntityId)).toBe(true);

		const returnedCard = ctx.state.opponentDeck.hand.find((c: DeckCard) => c.entityId === cwd!.returnTokenEntityId);
		expect(returnedCard).toBeDefined();
		expect(returnedCard!.creatorCardId).toBe(GODFREY_ATLAS_CREATOR);
		expect(returnedCard!.cardId == null || returnedCard!.cardId === '').toBe(true);
		expect(returnedCard!.cardId).not.toBe(SHRED_OF_TIME_CARD_ID);
		expect(getDisplayCardIdWhenGuessedPoolIsSingleCard(returnedCard!)).toBeNull();

		const godfreyZone = buildGofreyCards(ctx.state.opponentDeck, ctx.state.parserState);
		expect(godfreyZone.map((c) => c.cardId)).toEqual([DEMONIC_CONFINEMENT_CARD_ID]);
		expect(godfreyZone.length).toBe(pendingFromLog);
	}, 180_000);
});
