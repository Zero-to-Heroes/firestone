/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const FoolsGold: GeneratingCard = {
	cardIds: [CardIds.FoolsGold_DEEP_022],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: AllCardsService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
			metadata?: Metadata;
			validArenaPool?: readonly string[];
		},
	): GuessedInfo | null => {
		if (card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
				races: [Race.PIRATE],
				possibleCards: filterCards(
					FoolsGold.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.PIRATE),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					FoolsGold.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL),
					options,
				),
			};
		}
		return null;
	},
};
