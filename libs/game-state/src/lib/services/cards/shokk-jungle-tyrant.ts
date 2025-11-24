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

export const ShokkJungleTyrant: GeneratingCard = {
	cardIds: [CardIds.TheFoodChain_ShokkJungleTyrantToken_TLC_830t],
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
				attack: 8,
				cardType: CardType.MINION,
				races: [Race.BEAST],
				cost: 2,
				possibleCards: filterCards(
					ShokkJungleTyrant.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && c.attack === 8,
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				attack: 6,
				cardType: CardType.MINION,
				races: [Race.BEAST],
				cost: 2,
				possibleCards: filterCards(
					ShokkJungleTyrant.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && c.attack === 6,
					options,
				),
			};
		} else if (card.createdIndex === 2) {
			return {
				attack: 4,
				cardType: CardType.MINION,
				races: [Race.BEAST],
				cost: 2,
				possibleCards: filterCards(
					ShokkJungleTyrant.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && c.attack === 4,
					options,
				),
			};
		}
		return null;
	},
};
