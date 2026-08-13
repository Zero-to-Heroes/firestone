/**
 * Regression: counters must stay visible when their cards move to The Void.
 * Irida Sinseeker (JAIL_719) sends the remaining deck to SETASIDE / The Void;
 * those cards are still drawable, so hasRelevantCard (and counters gated on it)
 * should treat them as present. Same principle applies to Godfrey's queued
 * overdraws; this fixture covers Void only.
 *
 * Fixture: `void-counters.log` (copy of test-tools/power.log). Local player is
 * Chmielinho (player 2). After Irida, Climactic Necrotic Explosion (ETC_210,
 * entity 61) is in The Void, not in deck/hand — corpse-spent counter should
 * remain active.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/void-counters/power-log-void-counters-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { CardIds } from '@firestone-hs/reference-data';
import { Preferences } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { CorpseSpentCounterDefinitionV2, GameState } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import { CNE_CARD_ID, logShowsCneMovedToVoidByIrida, logShowsIridaPlay } from './void-counters-power-log-helpers';

describe('Power log replay → GameStateService (Void cards keep counters visible)', () => {
	const slug = 'void-counters';

	it('fixture: Irida play sends Climactic Necrotic Explosion to SETASIDE', () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));

		expect(logShowsIridaPlay(logLines)).toBe(true);
		expect(logShowsCneMovedToVoidByIrida(logLines)).toBe(true);
	});

	it('replays void-counters.log: CNE in The Void still counts for hasRelevantCard and corpse-spent counter', async () => {
		const logPath = resolvePowerLogPathForSlug(slug);
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);
		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'void-counters-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		const state: GameState = ctx.state;
		const cneId = CardIds.ClimacticNecroticExplosion;
		expect(cneId).toBe(CNE_CARD_ID);

		expect(state.playerDeck.voidZone.some((c) => c.cardId === cneId)).toBe(true);
		expect(state.playerDeck.deck.some((c) => c.cardId === cneId)).toBe(false);
		expect(state.playerDeck.hand.some((c) => c.cardId === cneId)).toBe(false);

		expect(state.playerDeck.hasRelevantCard([cneId])).toBe(true);

		const i18n = {
			translateString: (key: string, _params?: Record<string, unknown>) => key,
		} as ILocalizationService;
		const allCards = ctx.allCardsRef as unknown as CardsFacadeService;
		const counter = new CorpseSpentCounterDefinitionV2(i18n, allCards);
		counter.init({ arena: [] });
		const prefs = {
			playerCorpseSpentCounter: true,
		} as unknown as Preferences;

		expect(counter.isActive('player', state, state.bgState, prefs)).toBe(true);
	}, 120_000);
});
