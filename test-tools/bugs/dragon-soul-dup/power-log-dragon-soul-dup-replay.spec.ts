/**
 * Dragon Soul, Shattered (CATA_EVENT_110): Start of Game: Break into 6 Essences.
 * Adjoining Essences are cast together.
 *
 * Regression: opponent Start of Game creates two tracker rows per Aspect Essence
 * (one gifted, one without a gift). The ungifted copies should not be there — one
 * gifted copy of each essence in opponentDeck.deck.
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/dragon-soul-dup/power-log-dragon-soul-dup-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
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
	ASPECT_ESSENCE_CARD_IDS,
	DRAGON_SOUL_CARD_ID,
	DRAGON_SOUL_DUP_LOG_PATH,
	DRAGON_SOUL_OPPONENT_PLAYER_ID,
	parseDragonSoulDupFixtureMarkers,
} from './dragon-soul-dup-power-log-helpers';

describe('Power log replay → GameStateService (Dragon Soul duplicate essences)', () => {
	it('grounds FX dummy SETASIDE essences and real DISPLAYED_CREATOR deck entities in the fixture', () => {
		const logPath = resolvePowerLogPathForSlug('dragon-soul-dup');
		expect(logPath).toBe(DRAGON_SOUL_DUP_LOG_PATH);
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
		expect(lines.some((line) => line.includes('CREATE_GAME'))).toBe(true);

		const markers = parseDragonSoulDupFixtureMarkers(lines);
		expect(markers.fxDummyEssences.map((e) => e.cardId)).toEqual([...ASPECT_ESSENCE_CARD_IDS]);
		expect(markers.fxDummyEssences.every((e) => e.setAsideLineIndex > e.showEntityLineIndex)).toBe(true);
		expect(markers.realEssences.map((e) => e.entityId)).toEqual([78, 79, 80, 81, 82, 83]);
		expect(markers.realEssences[0].fullEntityLineIndex).toBeGreaterThan(
			markers.fxDummyEssences[markers.fxDummyEssences.length - 1].setAsideLineIndex,
		);
		expect(DRAGON_SOUL_CARD_ID).toBe(CardIds.DragonSoulShattered_CATA_EVENT_110);
	});

	it('replays log: opponent deck has one gifted copy of each Aspect Essence', async () => {
		const logPath = resolvePowerLogPathForSlug('dragon-soul-dup');
		const cardsPath = resolveCardsJsonPath();
		requirePowerLogReplayPrerequisites(cardsPath, logPath);

		const ctx = await replayPowerLogToGameState({
			logPath,
			reviewId: 'dragon-soul-dup-power-log-replay',
		});
		requirePowerLogReplayResult(ctx, cardsPath);

		try {
			expect(ctx.state.localPlayerId).not.toBe(DRAGON_SOUL_OPPONENT_PLAYER_ID);
			const opponentDeck = ctx.state.opponentDeck;

			for (const essenceId of ASPECT_ESSENCE_CARD_IDS) {
				const copies = opponentDeck.deck.filter((card) => card.cardId === essenceId);
				expect(copies.length).toBe(1);
				expect(copies[0].creatorCardId).toBe(DRAGON_SOUL_CARD_ID);
			}

			const ungiftedEssences = opponentDeck.deck.filter(
				(card) => ASPECT_ESSENCE_CARD_IDS.includes(card.cardId ?? '') && !card.creatorCardId,
			);
			expect(ungiftedEssences).toEqual([]);
		} finally {
			ctx.cleanup();
		}
	}, 300_000);
});
