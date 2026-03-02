import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../models/deck-state';
import { CustomEffectCard } from './_card.type';

export const WarmasterBlackhorn: CustomEffectCard = {
	cardIds: [CardIds.WarmasterBlackhorn_CATA_720],
	effect: 'ReuseFX_Generic_DeckAE_DeckBurn_SourceSide_Super',
	customEffect: ({ currentState, allCards }) => {
		return currentState.update({
			playerDeck: removeLowCostCards(currentState.playerDeck, allCards),
			opponentDeck: removeLowCostCards(currentState.opponentDeck, allCards),
		});
	},
};

const removeLowCostCards = (deckState: DeckState, allCards: AllCardsService): DeckState => {
	const newDeck = deckState.deck.filter((card) => {
		const refCard = card.cardId ? allCards.getCard(card.cardId) : null;
		return refCard?.cost == null || refCard.cost > 2;
	});
	return deckState.update({ deck: newDeck });
};
