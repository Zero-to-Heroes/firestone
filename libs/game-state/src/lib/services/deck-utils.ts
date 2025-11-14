import { DeckDefinition, DeckList, encode, FormatType } from '@firestone-hs/deckstrings';
import { CardClass, CardIds, getDefaultHeroDbfIdForClass, normalizeDeckHeroDbfId } from '@firestone-hs/reference-data';
import { DeckInfoFromMemory } from '@firestone/memory';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../models/deck-card';
import { DeckState } from '../models/deck-state';
import { Metadata } from '../models/metadata';

export const enrichDeck = (deckState: DeckState, metadata: Metadata, allCards: CardsFacadeService): DeckState => {
	const behemothUpgrades = deckState.globalEffects.filter((g) => g.cardId === CardIds.BolideBehemoth_GDB_434).length;
	return deckState.update({
		deck: updateAdditionalAttributes(deckState.deck, behemothUpgrades),
		hand: updateAdditionalAttributes(deckState.hand, behemothUpgrades),
	});
};

const updateAdditionalAttributes = (cards: readonly DeckCard[], behemothUpgrades: number): readonly DeckCard[] => {
	return cards.map((card) => {
		if (card.cardId === CardIds.Asteroid_GDB_430) {
			return card.update({
				mainAttributeChange: (card.mainAttributeChange ?? 0) + behemothUpgrades,
			});
		}
		return card;
	});
};

export const buildDeckDefinition = (
	deckFromMemory: DeckInfoFromMemory,
	allCards: CardsFacadeService,
): DeckDefinition => {
	const decklist: readonly number[] = normalizeWithDbfIds(deckFromMemory.DeckList, allCards);
	const deckDefinition: DeckDefinition = {
		format: deckFromMemory.FormatType as FormatType,
		cards: explodeDecklist(decklist),
		// Add a default to avoid an exception, for cases like Dungeon Runs or whenever you have an exotic hero
		heroes: deckFromMemory.HeroCardId
			? [normalizeDeckHeroDbfId(allCards.getCard(deckFromMemory.HeroCardId)?.dbfId ?? 7, allCards.getService())]
			: deckFromMemory.HeroClass
				? [getDefaultHeroDbfIdForClass(CardClass[deckFromMemory.HeroClass]) || 7]
				: [7],
		sideboards: !deckFromMemory.Sideboards?.length
			? undefined
			: deckFromMemory.Sideboards.map((sideboard) => {
					return {
						keyCardDbfId: allCards.getCard(sideboard.KeyCardId).dbfId,
						cards: explodeDecklist(normalizeWithDbfIds(sideboard.Cards, allCards)),
					};
				}),
	};
	return deckDefinition;
};

export const normalizeWithDbfIds = (
	decklist: readonly (number | string)[],
	allCards: CardsFacadeService,
): readonly number[] => {
	return decklist.map((cardId) => allCards.getCard(cardId)?.dbfId);
};

export const explodeDecklist = (initialDecklist: readonly number[]): any[] => {
	// console.log('[deck-parser] decklist with dbfids', initialDecklist);
	const groupedById = groupByFunction((cardId) => '' + cardId)(initialDecklist);

	const result = Object.keys(groupedById).map((id) => [+id, groupedById[id].length]);
	// console.log('[deck-parser] exploding decklist result', result);
	return result;
};
