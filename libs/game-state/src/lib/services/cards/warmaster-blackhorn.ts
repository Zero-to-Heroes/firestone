import { AllCardsService, CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../models/deck-state';
import { getProcessedCard } from '../card-utils';
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
		const refCard = card.cardId ? getProcessedCard(card.cardId, card.entityId, deckState, allCards) : null;
		return refCard?.cost == null || refCard.cost > 2;
	});
	return deckState.update({ deck: newDeck });
};
