import { CardIds, GameFormat, GameType } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { StaticGeneratingCardInput } from './_card.type';
import { TheGalacticProjectionOrb } from './the-galactic-projection-orb';

describe('TheGalacticProjectionOrb', () => {
	const buildInput = (spellsPlayedThisMatch: readonly DeckCard[]): StaticGeneratingCardInput => ({
		cardId: CardIds.TheGalacticProjectionOrb_TOY_378,
		entityId: 1,
		allCards: {} as any,
		inputOptions: {
			format: GameFormat.FT_STANDARD,
			gameType: GameType.GT_RANKED,
			scenarioId: 0,
			currentClass: 'MAGE',
			deckState: DeckState.create({
				spellsPlayedThisMatch,
			}),
			opponentDeckState: DeckState.create({}),
			gameState: {} as any,
			validArenaPool: [],
			initialDecklist: [],
		},
	});

	it('returns unique spells sorted by cost while preserving different spells of the same cost', () => {
		const result = TheGalacticProjectionOrb.dynamicPool(
			buildInput([
				DeckCard.create({ cardId: 'spell-3-b', refManaCost: 3 }),
				DeckCard.create({ cardId: 'spell-1', refManaCost: 1 }),
				DeckCard.create({ cardId: 'spell-3-a', refManaCost: 3 }),
				DeckCard.create({ cardId: 'spell-1', refManaCost: 1 }),
				DeckCard.create({ cardId: 'spell-2', refManaCost: 2 }),
			]),
		);

		expect(result).toEqual(['spell-1', 'spell-2', 'spell-3-b', 'spell-3-a']);
	});

	it('returns an empty pool when no spells have been played', () => {
		const result = TheGalacticProjectionOrb.dynamicPool(buildInput([]));

		expect(result).toEqual([]);
	});

	it('ignores entries without a card id and handles missing mana costs', () => {
		const result = TheGalacticProjectionOrb.dynamicPool(
			buildInput([
				DeckCard.create({ cardId: undefined as any, refManaCost: 7 }),
				DeckCard.create({ cardId: 'spell-unknown-cost' }),
				DeckCard.create({ cardId: 'spell-2', refManaCost: 2 }),
			]),
		);

		expect(result).toEqual(['spell-unknown-cost', 'spell-2']);
	});
});
