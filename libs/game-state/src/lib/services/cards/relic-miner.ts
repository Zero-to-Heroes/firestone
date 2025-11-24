/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardRarity, CardType, GameTag, RarityTYpe } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { hasCorrectClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';

export const RelicMiner: GeneratingCard = {
	cardIds: [CardIds.RelicMiner_TLC_109],
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
		},
	): GuessedInfo | null => {
		const cardEaten = deckState.otherZone.find((c) => c.lastAffectedByEntityId === card.creatorEntityId);
		if (!cardEaten) {
			return null;
		}

		const refCard = allCards.getCard(cardEaten.cardId);
		const refRarity: RarityTYpe = refCard.rarity;
		if (!refRarity) {
			return null;
		}
		const rarity: CardRarity = CardRarity[refRarity.toUpperCase() as string];
		const possibleCards = filterCards(RelicMiner.cardIds[0], allCards, (c) => hasCorrectRarity(c, rarity), options);
		return {
			rarity: rarity,
			possibleCards: possibleCards,
		};
	},
};
