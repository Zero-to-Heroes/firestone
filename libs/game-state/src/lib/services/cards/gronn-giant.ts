// Gronn Giant (CATA_616): 9 Mana 8/8 Neutral Minion
// "This minion's Cost is reduced by the Cost of the last card you played."
import { CardIds } from '@firestone-hs/reference-data';
import { pickLast } from '@firestone/shared/framework/common';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const GronnGiant: StaticGeneratingCard = {
	cardIds: [CardIds.GronnGiant_CATA_616],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const lastPlayedCard = pickLast(input.inputOptions.deckState.cardsPlayedThisMatch);
		return lastPlayedCard?.cardId ? [lastPlayedCard.cardId] : [];
	},
};
