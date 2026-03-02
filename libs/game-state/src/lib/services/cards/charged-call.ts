// Charged Call: 3 Mana Shaman spell
// "Discover a 1-Cost minion and summon it. (Upgraded for each Overload card you played this game!)"

import { CardIds, CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass, hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ChargedCall: StaticGeneratingCard = {
	cardIds: [CardIds.ChargedCall],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const overloadCardsPlayed =
			input.inputOptions.deckState.cardsPlayedThisMatch?.filter((c) =>
				input.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.OVERLOAD]),
			)?.length ?? 0;
		const targetCost = 1 + overloadCardsPlayed;
		return filterCards(
			ChargedCall.cardIds[0],
			input.allCards,
			(c: ReferenceCard) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', targetCost) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
