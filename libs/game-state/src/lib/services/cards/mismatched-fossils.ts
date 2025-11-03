/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { filterCards } from './utils';

export const MismatchedFossils: GeneratingCard = {
	cardIds: [CardIds.MismatchedFossils_DEEP_001],
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
		const currentClass = deckState.hero?.classes?.[0] ? CardClass[deckState.hero?.classes?.[0]] : '';
		if (card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.BEAST],
				possibleCards: filterCards(
					MismatchedFossils.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) &&
						hasCorrectTribe(c, Race.BEAST) &&
						canBeDiscoveredByClass(c, currentClass),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				races: [Race.UNDEAD],
				possibleCards: filterCards(
					MismatchedFossils.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) &&
						hasCorrectTribe(c, Race.UNDEAD) &&
						canBeDiscoveredByClass(c, currentClass),
					options,
				),
			};
		}
		return null;
	},
};
