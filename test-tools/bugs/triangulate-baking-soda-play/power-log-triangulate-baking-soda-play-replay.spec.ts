/**
 * Regression (Phase 1 — red test): After Triangulate discovers Baking Soda Volcano and shuffles 3 copies
 * into deck, playing the original deck copy (entity 22, not Triangulate-created) must not remove a
 * Triangulate-created copy from the deck list.
 *
 * Fixture: `triangulate-baking-soda-play.log` — last game from support power.zip, truncated after entity 22
 * play resolves (PowerTaskList ID=346). Local player Chmielinho (player 2); Triangulate caster SageSatyr (player 1).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/triangulate-baking-soda-play/power-log-triangulate-baking-soda-play-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import * as fs from 'fs';
import {
	collectAllDeckCards,
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	assertTriangulateBakingSodaPlayAnchorsFromPowerLogLines,
	countBakingSodaVolcanoInDeckAsTracked,
	DRAWN_DECK_ENTITY,
	prepareTriangulateBakingSodaPlayFixtureLines,
	SHUFFLED_COPY_ENTITY_IDS,
	TRIANGULATE_CARD_ID,
	TRIANGULATE_PLAYER_CONTROLLER,
	triangulateCasterDeckFromReplayState,
} from './triangulate-baking-soda-play-power-log-helpers';

const BAKING_SODA_CARD_ID = CardIds.BakingSodaVolcano_TOY_500;

const deckEntityId = (c: DeckCard): number | undefined => c.entityId ?? c.trueEntityId;

describe('Power log replay → Triangulate + Baking Soda Volcano play', () => {
	it('fixture: last game through entity 22 play (PowerTaskList ID=346)', () => {
		const logPath = resolvePowerLogPathForSlug('triangulate-baking-soda-play');
		requirePowerLogFixtureExists(logPath);
		const lines = prepareTriangulateBakingSodaPlayFixtureLines(fs.readFileSync(logPath, 'utf8'));
		assertTriangulateBakingSodaPlayAnchorsFromPowerLogLines(lines);
	});

	it(
		'replays log; after playing original Baking Soda, 3 Triangulate copies remain in deck',
		async () => {
			const logPath = resolvePowerLogPathForSlug('triangulate-baking-soda-play');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);

			const replayLines = prepareTriangulateBakingSodaPlayFixtureLines(fs.readFileSync(logPath, 'utf8'));

			const ctx = await replayPowerLogToGameState({
				logPath,
				logLinesOverride: replayLines,
				reviewId: 'triangulate-baking-soda-play-replay',
				settleMs: 90_000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);

			expect(ctx.state.localPlayerId).not.toBe(TRIANGULATE_PLAYER_CONTROLLER);

			const casterDeck = triangulateCasterDeckFromReplayState(ctx.state);

			expect(casterDeck.deck.filter((c) => deckEntityId(c) === DRAWN_DECK_ENTITY)).toEqual([]);
			expect(casterDeck.hand.filter((c) => deckEntityId(c) === DRAWN_DECK_ENTITY)).toEqual([]);

			const shuffledCopyCards = collectAllDeckCards(ctx.state).filter((c) =>
				SHUFFLED_COPY_ENTITY_IDS.includes(deckEntityId(c) as (typeof SHUFFLED_COPY_ENTITY_IDS)[number]),
			);
			expect(shuffledCopyCards.length).toBe(SHUFFLED_COPY_ENTITY_IDS.length);

			for (const c of shuffledCopyCards) {
				expect(c.creatorCardId).toBe(TRIANGULATE_CARD_ID);
				expect(c.cardId).toBe(BAKING_SODA_CARD_ID);
			}

			expect(countBakingSodaVolcanoInDeckAsTracked(casterDeck)).toBe(SHUFFLED_COPY_ENTITY_IDS.length);
		},
		180_000,
	);
});
