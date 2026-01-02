/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardRarity, CardType, GameTag, RarityTYpe } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';

// Relic Miner (TLC_109)
// 3 Mana 3/3 Minion
// Battlecry: Destroy the top card of your deck. Discover a card of the same Rarity.
// Since it uses "Discover", it should only show cards from the player's class or neutral cards.
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
		const currentClassStr = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			RelicMiner.cardIds[0],
			input.allCards,
			(c) => hasCorrectRarity(c, rarity) && canBeDiscoveredByClass(c, currentClassStr),
			input.options,
		);
		return {
			rarity: rarity,
			possibleCards: possibleCards,
		};
	},
};
