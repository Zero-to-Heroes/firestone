/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardRarity, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { fromAnotherClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { filterCards } from './utils';

export const ShellGame: GeneratingCard = {
	cardIds: [CardIds.ShellGame_WW_416],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: CardsFacadeService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
			metadata?: Metadata;
			validArenaPool?: readonly string[];
		},
	): GuessedInfo | null => {
		const currentClass = deckState.hero?.classes?.[0] ?? null;
		if (card.createdIndex === 0) {
			const rarity = CardRarity.EPIC;
			return {
				rarity: rarity,
				possibleCards: filterCards(
					ShellGame.cardIds[0],
					allCards,
					(c) =>
						fromAnotherClass(c, currentClass ? CardClass[currentClass] : undefined) &&
						c.rarity?.toUpperCase() === CardRarity[rarity],
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			const rarity = CardRarity.RARE;
			return {
				rarity: rarity,
				possibleCards: filterCards(
					ShellGame.cardIds[0],
					allCards,
					(c) =>
						fromAnotherClass(c, currentClass ? CardClass[currentClass] : undefined) &&
						c.rarity?.toUpperCase() === CardRarity[rarity],
					options,
				),
			};
		} else if (card.createdIndex === 2) {
			const rarity = CardRarity.COMMON;
			return {
				rarity: rarity,
				possibleCards: filterCards(
					ShellGame.cardIds[0],
					allCards,
					(c) =>
						fromAnotherClass(c, currentClass ? CardClass[currentClass] : undefined) &&
						c.rarity?.toUpperCase() === CardRarity[rarity],
					options,
				),
			};
		}
		return null;
	},
};
