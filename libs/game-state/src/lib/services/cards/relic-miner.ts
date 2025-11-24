/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardRarity, CardType, GameTag, RarityTYpe } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { hasCorrectClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';

export const RelicMiner: GeneratingCard = {
	cardIds: [CardIds.RelicMiner_TLC_109],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const cardEaten = input.deckState.otherZone.find(
			(c) => c.lastAffectedByEntityId === input.card.creatorEntityId,
		);
		if (!cardEaten) {
			return null;
		}

		const refCard = input.allCards.getCard(cardEaten.cardId);
		const refRarity: RarityTYpe = refCard.rarity;
		if (!refRarity) {
			return null;
		}
		const rarity: CardRarity = CardRarity[refRarity.toUpperCase() as string];
		const possibleCards = filterCards(
			RelicMiner.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, rarity),
			input.options,
		);
		return {
			rarity: rarity,
			possibleCards: possibleCards,
		};
	},
};
